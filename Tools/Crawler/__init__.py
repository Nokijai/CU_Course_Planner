from typing import Any, List, Union
import requests
from PIL import Image
from bs4 import BeautifulSoup
from contextlib import closing
from tqdm import tqdm
import re
import io
import sys
import os
import json
import time
import traceback
import onnxruntime
import ddddocr
from .utils import make_dirs, parse_days_and_times, HiddenPrints, get_date_sort_key
from functools import reduce

# Captcha
onnxruntime.set_default_logger_severity(3)
ocr = ddddocr.DdddOcr()
MAX_AUTO_CAPTCHA_ATTEMPTS = 16

# General
FLUSH = '\x1b[1K\r'


class CourseScraper:
    def __init__(self, current_term="2022-23 Term 1", merge_dir='../data', dirname='data', course_dirname='courses', derived_dirname='derived', resources_dirname='resources', save_captchas=False, timestamp: Union[str, bool] = False):
        now = str(int(time.time())) if type(timestamp) is bool else timestamp
        self.dir_prefix = os.path.join(dirname, now)
        self.timestamp = now
        self.current_term = current_term
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 11_1_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.88 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9'
        }
        self.form_headers = {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 11_1_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.88 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
            'Upgrade-Insecure-Requests': '1',
            'Content-Type': 'application/x-www-form-urlencoded',
        }
        self.course_url = 'http://rgsntl.rgs.cuhk.edu.hk/aqs_prd_applx/Public/tt_dsp_crse_catalog.aspx'
        self.sess = requests.Session()
        self.courses = {}
        self.form_body = {}
        self.stat_dir = os.path.join(
            os.path.dirname(os.path.abspath(__file__)), 'stat')
        self.course_dirname = os.path.join(self.dir_prefix, course_dirname)
        self.derived_dirname = os.path.join(self.dir_prefix, derived_dirname)
        self.resources_dirname = os.path.join(
            self.dir_prefix, resources_dirname)
        self.save_captchas = save_captchas
        self.auto_captcha_attempts = 0
        make_dirs([dirname, self.dir_prefix, self.course_dirname, self.derived_dirname,
                  self.stat_dir, self.resources_dirname, 'captchas', 'logs'])
        self.log_file = open(os.path.join('logs', f'parser-{now}.log'), 'w')
        self.old_courses_dir = os.path.join(merge_dir, 'courses')
        try:
            # Need to accumulate instructors for ppl to write reviews for prev courses
            with open(os.path.join(merge_dir, 'resources/instructors.json'), 'r') as f:
                self.instructors = json.load(f)
        except FileNotFoundError:
            self.instructors = []

    def post_processing(self, stat=False):
        if stat:
            self.generate_stat()
        try:
            self.log_file.close()
        except Exception:
            pass

    def generate_stat(self):
        self.remove_empty_courses()
        self.process_subjects(label_availability=True, concise=True)
        self.process_instructors_name()
        # Below for frontend only, and no need update per sem unless faculty changed / new course code
        self.process_faculty_subjects()
        self.group_faculty_subjects()
        self.get_courses_hashset()

    def with_course(self, fn):
        with os.scandir(self.course_dirname) as it:
            for entry in it:
                with open(entry.path, 'r') as f:
                    filename = entry.path[(len(self.course_dirname)+1):-5]
                    if(len(filename) == 4):  # i.e. filename is a valid subject code
                        courses = json.load(f)
                        fn(courses, filename, f)

    def with_course_section(self, fn):
        def append_to_sections(courses, subject, f):
            for course in courses:
                if 'terms' in course:
                    for term in course['terms'].values():
                        for section in term.values():
                            fn(section, course)
        self.with_course(append_to_sections)

    def info(self):
        c = {}

        def _info(courses, filename, file):
            c[filename] = courses
        self.with_course(_info)
        print(
            f"Number of courses: {reduce(lambda a, x: a + len(x), c.values(), 0)}")
    # Get all department codes

    def process_faculty_subjects(self):
        subject_department_mapping = {}
        subjects_under_department = {}

        def append_to_mapping(courses, subject, f):
            for course in courses:
                if 'academic_group' in course:
                    subject_department_mapping[subject] = course['academic_group']
                    break
        self.with_course(append_to_mapping)
        with open(os.path.join(self.derived_dirname, 'subjects.json'), 'w') as f:
            json.dump(subject_department_mapping, f)
        for k, v in subject_department_mapping.items():
            if v in subjects_under_department:
                subjects_under_department[v].append(k)
            else:
                subjects_under_department[v] = [k]
        print(f'Number of departments: {len(subjects_under_department)}')
        with open(os.path.join(self.derived_dirname, 'departments.json'), 'w') as f:
            json.dump(subjects_under_department, f)

    # Get all courses under a subject, and save Id and title only
    def process_subjects(self, label_availability=False, concise=False):
        all_courses = {}

        def append_to_subjects(courses, subject, f):
            course_list = []
            for course in courses:
                course_concise = {
                    'courseId' if not concise else 'c': subject + course['code'],
                    'title' if not concise else 't': course['title']
                }
                if label_availability:
                    avaliable = False
                    if 'terms' in course:
                        for term in course['terms'].keys():
                            if term == self.current_term:
                                avaliable = True
                                break
                    if avaliable:
                        course_concise['offerring' if not concise else 'o'] = 1
                course_list.append(course_concise)
            all_courses[subject] = course_list
        self.with_course(append_to_subjects)
        with open(os.path.join(self.resources_dirname, 'course_list.json'), 'w') as f:
            json.dump(all_courses, f)

    # Get all lecturer name
    def process_instructors_name(self):
        TITLE_PREFIXS = ['Ms', 'Dr', 'Mr', 'Miss', 'Professor', 'Prof']
        REMOVE_TITLE_REGEX = r'\b(?:' + '|'.join(TITLE_PREFIXS) + r')\.\s*'
        CLEANING_REGEX = r'|'.join(map(re.escape, [
                                   '.', '\n\r', '\n\n', '***'] + list(map(lambda x: f"{x} ", TITLE_PREFIXS))))
        instructors = set(self.instructors)

        def append_to_instructors(section, course):
            for instructor in section['instructors']:
                # Remove the title
                instructor = re.sub(REMOVE_TITLE_REGEX, '', instructor)
                instructor = re.sub(CLEANING_REGEX, '', instructor).strip()
                # Split for multiple instructors in one section
                for part in instructor.split(', '):
                    instructors.add(part)

        self.with_course_section(append_to_instructors)
        sorted_instructors = list(instructors)
        sorted_instructors.sort()
        print(f"Found {len(sorted_instructors)} instructors")
        with open(os.path.join(self.resources_dirname, 'instructors.json'), 'w') as f:
            json.dump(sorted_instructors, f)

    def remove_empty_courses(self):
        def append_to_remove(courses, subject, f):
            if not courses or len(courses) == 0:
                self.log_file.write(f'Removed empty {subject}.json\n')
                os.remove(os.path.join(self.course_dirname, f'{subject}.json'))
        self.with_course(append_to_remove)

    def faculty_department_mapping(self):
        department_list = {}
        with open(os.path.join(self.derived_dirname, 'departments.json'), 'r') as f:
            department_subjects = json.load(f)
            for department, subjects in department_subjects.items():
                # Need manually edit each field now
                department_list[department] = 0
        with open(os.path.join(self.stat_dir, 'faculty_departments.json'), 'w') as f:
            json.dump(department_list, f)

    def group_faculty_subjects(self):
        try:
            faculty_subjects = {}
            with open(os.path.join(self.stat_dir, 'faculties.json'), 'r') as f:
                faculty_keys = json.load(f)
                faculty_lookup = {}
                for faculty, key in faculty_keys.items():
                    faculty_subjects[faculty] = []
                    faculty_lookup[key] = faculty
                with open(os.path.join(self.stat_dir, 'faculty_departments.json'), 'r') as f:
                    department_faculty_mapping = json.load(f)
                    with open(os.path.join(self.derived_dirname, 'departments.json'), 'r') as f:
                        department_subjects = json.load(f)
                        for department, faculty_key in department_faculty_mapping.items():
                            try:
                                faculty_subjects[faculty_lookup[faculty_key]
                                                 ] += department_subjects[department]
                            except Exception:
                                self.log_file.write(
                                    'Missing department (maybe renamed) {}\n'.format(department))
                                self.log_file.write(traceback.format_exc())

            for arr in faculty_subjects.values():
                arr.sort()

            with open(os.path.join(self.derived_dirname, 'faculty_subjects.json'), 'w') as f:
                json.dump(faculty_subjects, f)
        except FileNotFoundError:
            self.faculty_department_mapping()
            print('Generated departments mapping, please label with faculty code')

    def parse_all(self, save=True, manual=False, skip_parsed=False, verbose=True):
        self.get_code_list()
        num_subjects = len(self.code_list)
        print(
            f'Parsing courses for all {num_subjects} subjects, {"skip if already existed" if skip_parsed else ""}')
        parsed_subjects = {}
        if skip_parsed:
            with os.scandir(self.course_dirname) as it:
                for entry in it:
                    subject = entry.path[(len(self.course_dirname)+1):-5]
                    parsed_subjects[subject] = True
        for idx, code in enumerate(tqdm(self.code_list), start=1):
            with HiddenPrints(not verbose):
                if skip_parsed and code in parsed_subjects:
                    print(
                        f'({idx}/{num_subjects}) {code} found in dir, skipped parsing')
                    continue
                print(f'({idx}/{num_subjects})', end=' ')
                self.search_subject(code, save, manual)
        print(f"Done! Saved at {self.dir_prefix}")
        return self.timestamp

    def get_courses_hashset(self):
        subject_courses_list = {}
        full_name_courses = []

        def append_to_hashset(courses, subject, f):
            courses_list = []
            for course in courses:
                code = course["code"]
                courses_list.append(code)
                full_name_courses.append(f"{subject}{code}")
            subject_courses_list[subject] = courses_list
        self.with_course(append_to_hashset)
        with open(os.path.join(self.derived_dirname, 'subject_course_names.json'), 'w') as f:
            json.dump(subject_courses_list, f)
        # Derive all courses list for FE to use
        with open(os.path.join(self.derived_dirname, 'courses.json'), 'w') as f:
            json.dump(full_name_courses, f)

    def get_code_list(self):
        with closing(requests.get(self.course_url, headers=self.headers)) as res:
            soup = BeautifulSoup(res.text, 'html.parser')
            code_list = []
            for node in soup.select('#ddl_subject option')[1:]:
                code_list.append(node.get('value'))
            # print(list(filter(None, code_list)))
            self.code_list = list(filter(None, code_list))

    def get_captcha(self, soup: BeautifulSoup, manual=False) -> Image:
        captcha_id = soup.select_one('#hf_Captcha')['value']
        captcha_url = f'http://rgsntl.rgs.cuhk.edu.hk/aqs_prd_applx/Public/BuildCaptcha.aspx?captchaname={captcha_id}&len=4'
        with closing(self.sess.get(captcha_url, headers=self.headers)) as captcha_res:
            in_memory_file = io.BytesIO(captcha_res.content)
            im = Image.open(in_memory_file)
            if manual:
                im.show()
                captcha = str(input('Input the captcha here: '))
            else:
                captcha = ocr.classification(in_memory_file.getvalue())
                print(
                    f'Recognized captcha: {captcha} (#{self.auto_captcha_attempts})')
            self.form_body.update({
                'hf_Captcha': captcha_id,
                'txt_captcha': captcha,
            })
            return im

    def update_form(self, soup: BeautifulSoup, update=True, additional_keys=None) -> dict:
        form_body = {'__VIEWSTATEFIELDCOUNT': soup.select_one(
            '#__VIEWSTATEFIELDCOUNT')['value']}
        form_keys = ['__EVENTVALIDATION', '__VIEWSTATEGENERATOR', '__VIEWSTATE'] + \
            [f'__VIEWSTATE{str(i)}' for i in range(
                1, int(form_body['__VIEWSTATEFIELDCOUNT']))]
        if additional_keys:
            form_keys.extend(additional_keys)
        for k in form_keys:
            id = k.replace('$', '_')
            form_body[k] = soup.select_one(f'#{id}')['value']
        if update:
            self.form_body.update(form_body)
        else:
            return form_body

    # get all course under a subject code
    def search_subject(self, subject, save=True, manual=False):
        print(f'Parsing courses under subject {subject}')
        with closing(self.sess.get(self.course_url, headers=self.headers)) as res:
            soup = BeautifulSoup(res.text, 'html.parser')
            self.update_form(soup)
            self.form_body.update({
                'ddl_subject': subject,
                'hf_previous_page': 'SEARCH',
                'hf_max_search_iteration': '1',
                'hf_search_iteration': '1',
            })
            while True:
                im = self.get_captcha(soup, manual)
                form_body = {'btn_search': 'Search'}
                form_body.update(self.form_body)
                with closing(self.sess.post(self.course_url, headers=self.form_headers, data=form_body)) as res:
                    correct_captcha = self.parse_subject_courses(
                        subject, res.text, save)
                    if correct_captcha:
                        self.auto_captcha_attempts = 0
                        if self.save_captchas:
                            # Save image & label here as training dataset
                            filename = str(int(time.time()))
                            im.save(
                                f"captchas/{self.form_body['txt_captcha']}_{filename}.png")
                        break
                    else:
                        if not manual:
                            self.auto_captcha_attempts += 1
                            if self.auto_captcha_attempts > MAX_AUTO_CAPTCHA_ATTEMPTS:
                                print(
                                    f'Reached max attempt of {MAX_AUTO_CAPTCHA_ATTEMPTS}, please enter manually!')
                                manual = True
                        print('Wrong captcha!')

    # parse the courses under a subject and get details of each course
    def parse_subject_courses(self, subject, html, save):
        global FLUSH
        course_list = []
        course_code_set = set()
        soup = BeautifulSoup(html, 'html.parser')
        self.update_form(soup)
        course_detail_node = soup.select_one('#gv_detail')
        if not course_detail_node:
            return False
        course_row_nodes = course_detail_node.findChildren(
            'tr', recursive=False)
        course_row_nodes.pop(0)  # remove the header node
        print(f'Found {len(course_row_nodes)} courses under subject {subject}')
        for i, row in enumerate(course_row_nodes):
            a_node = row.select('a')
            course = {
                'code': a_node[0].text,
                'title': a_node[1].text,
            }
            sys.stdout.write('{}Posting request #{} for {}{} {}'.format(
                FLUSH, i + 1, subject, course['code'], course['title']))
            form_body = {
                '__EVENTTARGET': 'gv_detail$ctl{}$lbtn_course_title'.format(f'0{i+2}' if i + 2 < 10 else str(i+2)),
            }
            form_body.update(self.form_body)
            with closing(self.sess.post(self.course_url, headers=self.headers, data=form_body)) as res:
                course_detail = self.parse_course_detail(
                    res.text, subject + course['code'])
                course.update(course_detail)
            course_code_set.add(course["code"])
            course_list.append(course)
        course_list = sorted(course_list, key=lambda x: x['code'])
        if save:
            # Check for old entries and merge
            old_courses = self.__load_subject(subject)
            for course in old_courses:
                if not course["code"] in course_code_set:
                    course_list.append(course)
            with open(os.path.join(self.course_dirname, f'{subject}.json'), 'w') as f:
                json.dump(course_list, f)
        print(f'{FLUSH}Saved {len(course_list)} {subject} courses in {os.path.join(self.course_dirname, subject)}.json')
        self.courses[subject] = course_list
        return True

    def __load_subject(self, subject) -> List[Any]:
        try:
            subject_path = os.path.join(
                self.old_courses_dir, f"{subject}.json")
            with open(subject_path, 'r') as f:
                return json.load(f)
        except Exception:
            self.log_file.write(traceback.format_exc())
            return []

    def parse_course_detail(self, html, course_id) -> dict:
        # Get general information about the course
        soup = BeautifulSoup(html, 'html.parser')
        try:
            course_detail = {
                'career': soup.select_one('#uc_course_lbl_acad_career').text,
                'units': soup.select_one('#uc_course_lbl_units').text,
                'grading': soup.select_one('#uc_course_lbl_grading_basis').text,
                'components': soup.select_one('#uc_course_lbl_component').text,
                'campus': soup.select_one('#uc_course_lbl_campus').text,
                'academic_group': soup.select_one('#uc_course_lbl_acad_group').text,
                'requirements': soup.select_one('#uc_course_tc_enrl_requirement'),
                'description': soup.select_one('#uc_course_lbl_crse_descrlong').text,
                'outcome': '',
                'syllabus': '',
                'required_readings': '',
                'recommended_readings': '',
            }
            course_detail['requirements'] = soup.select_one(
                '#uc_course_tc_enrl_requirement').get_text(';') if course_detail['requirements'] else ''
        except AttributeError as e:
            print('Error parsing information for this course')
            self.log_file.write(
                f'Error parsing course info for {course_id}: {str(e)}\n')
            self.log_file.write(traceback.format_exc())
            return {}

        # Get sections of the course
        try:
            term_selection_options = soup.select_one(
                '#uc_course_ddl_class_term').findChildren('option', recursive=False)
            terms = {}
            offered = False
            for term_node in term_selection_options:
                if term_node.has_attr('selected'):
                    course_sections = self.parse_sections(course_id, soup)
                else:
                    # post form request to get schedule for non-default term
                    form = {
                        'uc_course$btn_class_section': 'Show sections',
                        'uc_course$ddl_class_term': term_node['value'],
                    }
                    form.update(self.update_form(soup, update=False))
                    with closing(self.sess.post(self.course_url, headers=self.headers, data=form)) as res:
                        soup_alt = BeautifulSoup(res.text, 'html.parser')
                        course_sections = self.parse_sections(
                            course_id, soup_alt)
                    pass
                if course_sections:
                    offered = True
                    terms[term_node.text] = course_sections
            if offered:
                course_detail['terms'] = terms
            # Get course outcome for the course
            form = {
                'btn_course_outcome': 'Course Outcome',
                'uc_course$ddl_class_term': term_selection_options[0]['value'],
                'hf_previous_page': 'SEARCH'
            }
            form.update(self.update_form(soup, update=False, additional_keys=[
                        'hf_course_offer_nbr', 'hf_course_id']))

            with closing(self.sess.post(self.course_url, headers=self.headers, data=form)) as res:
                soup = BeautifulSoup(res.text, 'html.parser')
                course_detail.update({
                    'outcome': soup.select_one('#uc_course_outcome_lbl_learning_outcome').text,
                    'syllabus': soup.select_one('#uc_course_outcome_lbl_course_syllabus').text,
                    'required_readings': soup.select_one('#uc_course_outcome_lbl_req_reading').text,
                    'recommended_readings': soup.select_one('#uc_course_outcome_lbl_rec_reading').text,
                })
                assessment_nodes = soup.select_one('#uc_course_outcome_gv_ast').findChildren(
                    'tr', recursive=False)  # if no node, will raise error and return
                assessment_nodes.pop(0)
                assessments = {}
                for tr in assessment_nodes:
                    td_nodes = tr.select('td')
                    assessments[td_nodes[1].text] = td_nodes[2].text
                course_detail['assessments'] = assessments
        except AttributeError as e:
            # Probably just missing some non-mandatory fields
            # print('Error parsing terms for this course')
            self.log_file.write(
                f'Error parsing course terms for {course_id}: {str(e)}\n')
            self.log_file.write(traceback.format_exc())
            pass
        except Exception as e:
            print('Error parsing section / outcome for this course')
            self.log_file.write(
                f'Error parsing course details for {course_id}: {str(e)}\n')
            self.log_file.write(traceback.format_exc())
            pass
        return course_detail

    def parse_sections(self, course_id: str, soup: BeautifulSoup) -> dict:
        course_sections = {}
        course_sections_table_container = soup.select_one(
            '#uc_course_gv_sched')
        if not course_sections_table_container:
            return None
        course_sections_table = course_sections_table_container.findChildren(
            'tr', recursive=False)
        course_sections_table.pop(0)  # remove the header node
        for schedule in course_sections_table:
            try:
                # schedule is a <tr> tag with 3 children, first is the section code, second is the reg status, last is course detail table
                children = schedule.findChildren('td', recursive=False)
                section = children[0].text.strip('\n')
                start_times, end_times, days, locations, instructors, meeting_dates = [], [], [], [], [], ''
                # each tr is a teaching timeslot, e.g. Wed and Thu Lectures are two teaching timelot
                timeslots = children[2].findChildren('tr')
                for node in timeslots:
                    # 0: days & time 1: Room 2: Instructor 3: part of teaching date
                    details = list(filter(lambda x: x != '\n',
                                   node.get_text(';').split(';')))
                    days_and_times = parse_days_and_times(details[0])
                    meeting_dates += f', {details[3]}'
                    # i.e. duplicated (meeting dates may not dup, so add before continue)
                    if days_and_times[0] in days and days_and_times[1] in start_times:
                        continue
                    days.append(days_and_times[0])
                    start_times.append(days_and_times[1])
                    end_times.append(days_and_times[2])
                    locations.append(details[1])
                    instructors.append(details[2])
                # split, dedup & sort dates
                processed_meeting_dates = sorted(set(list(filter(None, meeting_dates.split(', ')))), key=get_date_sort_key)
                course_sections[section] = {
                    'startTimes': start_times,
                    'endTimes': end_times,
                    'days': days,
                    'locations': locations,
                    'instructors': instructors,
                    'meetingDates': processed_meeting_dates,
                }
            except Exception as e:
                # Probably just missing some non-mandatory fields
                self.log_file.write(
                    f'Error parsing course section for {course_id}: {str(e)}\n')
                self.log_file.write(traceback.format_exc())
                pass

        return course_sections
