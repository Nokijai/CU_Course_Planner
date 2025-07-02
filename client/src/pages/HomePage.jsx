import React from 'react';
import { Link } from 'react-router-dom';
import { Search, Calendar, Heart, BookOpen, GraduationCap, Clock, Users, Award } from 'lucide-react';

const HomePage = () => {
  const features = [
    {
      icon: Search,
      title: 'Course Search',
      description: 'Find courses by subject, code, or keywords with advanced filtering options.',
      link: '/search'
    },
    {
      icon: Calendar,
      title: 'Schedule Builder',
      description: 'Create and manage your course schedule with conflict detection and optimization.',
      link: '/schedule'
    },
    {
      icon: Heart,
      title: 'Favorites',
      description: 'Save your favorite courses and track your academic interests.',
      link: '/favorites'
    },
    {
      icon: BookOpen,
      title: 'Course Details',
      description: 'View comprehensive course information including prerequisites, assessments, and schedules.',
      link: '/search'
    }
  ];

  const stats = [
    { icon: GraduationCap, label: 'Academic Groups', value: '125+' },
    { icon: BookOpen, label: 'Courses Available', value: '8,400+' },
    { icon: Clock, label: 'Terms Covered', value: '2024-25' },
    { icon: Users, label: 'Instructors', value: '2,900+' }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Plan Your Academic Journey at{' '}
              <span className="text-yellow-300">CUHK</span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100 max-w-3xl mx-auto">
              Discover courses, build schedules, and track your progress at The Chinese University of Hong Kong
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/search"
                className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors inline-flex items-center justify-center space-x-2"
              >
                <Search className="h-5 w-5" />
                <span>Search Courses</span>
              </Link>
              <Link
                to="/schedule"
                className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors inline-flex items-center justify-center space-x-2"
              >
                <Calendar className="h-5 w-5" />
                <span>Build Schedule</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div key={index} className="text-center">
                  <div className="flex justify-center mb-4">
                    <Icon className="h-12 w-12 text-blue-600" />
                  </div>
                  <div className="text-3xl font-bold text-gray-900 mb-2">{stat.value}</div>
                  <div className="text-gray-600">{stat.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Everything You Need to Plan Your Studies
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Comprehensive tools to help you make informed decisions about your academic path
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Link
                  key={index}
                  to={feature.link}
                  className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow group"
                >
                  <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mb-4 group-hover:bg-blue-200 transition-colors">
                    <Icon className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Start Planning?
          </h2>
          <p className="text-xl mb-8 text-blue-100 max-w-2xl mx-auto">
            Join thousands of CUHK students who use our platform to optimize their academic journey
          </p>
          <Link
            to="/search"
            className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors inline-flex items-center space-x-2"
          >
            <Search className="h-5 w-5" />
            <span>Get Started</span>
          </Link>
        </div>
      </section>

      {/* About Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                About CUHK Course Planner
              </h2>
              <p className="text-lg text-gray-600 mb-6">
                CUHK Course Planner is an independent platform designed to help students at The Chinese University of Hong Kong 
                make informed decisions about their academic journey. Our comprehensive database includes course information, 
                schedules, prerequisites, and more.
              </p>
              <p className="text-lg text-gray-600 mb-8">
                We provide tools for course discovery, schedule building, and academic planning to enhance your university experience.
              </p>
              <div className="flex items-center space-x-4">
                <Award className="h-8 w-8 text-blue-600" />
                <span className="text-lg font-semibold text-gray-900">Independent & Reliable</span>
              </div>
            </div>
            <div className="bg-gray-100 rounded-lg p-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Key Features</h3>
              <ul className="space-y-3">
                <li className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  <span>Real-time course data from CUHK</span>
                </li>
                <li className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  <span>Advanced search and filtering</span>
                </li>
                <li className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  <span>Schedule conflict detection</span>
                </li>
                <li className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  <span>Prerequisite checking</span>
                </li>
                <li className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  <span>Course recommendations</span>
                </li>
                <li className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  <span>Mobile-friendly interface</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage; 