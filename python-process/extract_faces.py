import cv2
import mediapipe as mp
import numpy as np
import os

def extract_faces_from_video(video_path, output_folder, num_images, base_name=None):
    if not os.path.exists(video_path):
        print(f"Video file {video_path} does not exist.")
        return
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        print(f"Cannot open video: {video_path}")
        return
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    print(f"Total frames: {total_frames}")
    if total_frames < num_images:
        print(f"Video has fewer frames ({total_frames}) than requested images ({num_images})")
        cap.release()
        return
    frame_interval = max(1, total_frames // num_images)
    print(f"Frame interval: {frame_interval}")
    os.makedirs(output_folder, exist_ok=True)
    if not os.access(output_folder, os.W_OK):
        print(f"No write permission for directory {output_folder}")
        cap.release()
        return
    # Gán module face_mesh của thư viện mediapipe vào biến mp_face_mesh va Tạo một đối tượng FaceMesh từ mediapipe, để xử lý ảnh đầu vào
    mp_face_mesh = mp.solutions.face_mesh
    face_mesh = mp_face_mesh.FaceMesh(static_image_mode=True)

    if base_name is None:
        base_name = os.path.splitext(os.path.basename(video_path))[0]
    for i in range(num_images):
        frame_pos = i * frame_interval
        cap.set(cv2.CAP_PROP_POS_FRAMES, frame_pos)
        ret, frame = cap.read()
        if not ret:
            print(f"Cannot read frame at position {frame_pos}")
            continue
        frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB) # vì face_mesh yêu cầu ảnh đầu vào là RGB, trong khi frame được lấy từ cv2 là BGR
        # dung doi tuong face_mesh vua tao để phát hiện khuôn mặt và các điểm đặc trưng trong ảnh RGB.
        results = face_mesh.process(frame_rgb)
        mask = np.zeros(frame.shape[:2], dtype=np.uint8) #Tạo một mask ảnh đen có kích thước bằng với ảnh gốc (chỉ lấy chiều cao và rộng, không có kênh màu).

        if results.multi_face_landmarks:
            for face_landmarks in results.multi_face_landmarks:
                points = [(int(p.x * frame.shape[1]), int(p.y * frame.shape[0])) for p in face_landmarks.landmark]
                hull = cv2.convexHull(np.array(points))
                cv2.fillConvexPoly(mask, hull, 255)
                face_only = cv2.bitwise_and(frame, frame, mask=mask)
                img_name = os.path.join(output_folder, f"{base_name}_face_{i+1}.jpg")
                cv2.imwrite(img_name, face_only)
                print(f"Saved face image: {img_name}")
        else:
            print(f"No face detected in frame {frame_pos}")

    cap.release()
    face_mesh.close()


