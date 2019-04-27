import face_recognition
import cv2
import numpy as np
from livenessmodel import get_liveness_model
from common import get_users_mo
import sys
from time import *
import os

debut = time()

referenceImage = sys.argv[1]
imagesDirectory = sys.argv[2]

font = cv2.FONT_HERSHEY_DUPLEX

# Get the liveness network
model = get_liveness_model()

# load weights into new model

#print(os.path.dirname(os.path.realpath(__file__)))
tmp = os.path.dirname(os.path.realpath(__file__)).split('/')
#tmp = tmp[:-1]
path = ""
for i in tmp:
    path += i + "/"

model.load_weights(path + "model/model.h5")
#print("Loaded model from disk")

# Read the users data and create face encodings
#known_names, known_encods = get_users_mo()
#"""try:
#    encod = get_users_mo(name)

#except(Exception):"""

img = face_recognition.load_image_file(referenceImage)
encodingRef = face_recognition.face_encodings(img)[0]

#print((encod.shape))
#video_capture = cv2.VideoCapture(0)
#video_capture.set(3, 640)
#video_capture.set(4, 480)

process_this_frame = True
input_vid = []
iterations = 0
end = False
for iterations in range(50):

    #if(iterations>50):
    #    break
    #print("iterations= " + str(iterations))
    # Grab a single frame of video

    #print(imagesDirectory + "/" + str(iterations) + ".png")
    if len(input_vid) < 24:

        frame =cv2.imread(imagesDirectory + "/" + str(iterations) + ".png")

        liveimg = cv2.resize(frame, (100, 100))
        liveimg = cv2.cvtColor(liveimg, cv2.COLOR_BGR2GRAY)
        input_vid.append(liveimg)
    else:
        frame = cv2.imread(imagesDirectory + "/" + str(iterations) + ".png")
        liveimg = cv2.resize(frame, (100, 100))
        liveimg = cv2.cvtColor(liveimg, cv2.COLOR_BGR2GRAY)
        input_vid.append(liveimg)
        inp = np.array([input_vid[-24:]])
        inp = inp / 255
        inp = inp.reshape(1, 24, 100, 100, 1)
        pred = model.predict(inp)
        #print(pred)
        input_vid = input_vid[-25:]
        #######
        ####
        if pred[0][0] > .95:
     #       print('live')
            # recognition start
            # Resize frame of video to 1/4 size for faster face recognition processing
            #small_frame = cv2.resize(frame, (0, 0), fx=0.25, fy=0.25)
            small_frame = frame
            # Only process every other frame of video to save time
            if process_this_frame:
                # Find all the faces and face encodings in the current frame of video
                face_locations = face_recognition.face_locations(small_frame)
                face_encodings = face_recognition.face_encodings(small_frame, face_locations)
                him = False
                face_names = []
                for face_encoding in face_encodings:
                    match = face_recognition.compare_faces([encodingRef], face_encoding)
                    #print(match[0])
                    if match[0]:
                        print("identical faces",end="")
                        fin = time()
                        #print(str(fin - debut) + 'secondes')
                        end = True
                        break
                if(end):
                    break
            process_this_frame = not process_this_frame


        # Hit 'q' on the keyboard to quit!
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

# Release handle to the webcam

#video_capture.release()
if(not end):
    print("not identical",end="")
cv2.destroyAllWindows()