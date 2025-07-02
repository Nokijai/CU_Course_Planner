import os
import onnxruntime
import ddddocr

onnxruntime.set_default_logger_severity(3)
ocr = ddddocr.DdddOcr()

path = "captchas"

count = 0
t_count = 0

for f in os.listdir(path):
    name, ext = os.path.splitext(f)
    if ext == '.png':
        label, time = name.split('_')
        with open(os.path.join(path, f), 'rb') as img:
            img_bytes = img.read()
            res = ocr.classification(img_bytes)
            count += 1
            if res == label:
                t_count +=1

print(f"Accuracy: {round(t_count/count, 5)} ({t_count}/{count})")
