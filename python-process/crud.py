from deepface import DeepFace 
import os
import numpy as np
from pathlib import Path

def add_person(person_name, embeddings_file="embeddings.npy", model_name="Facenet512"):
    script_dir = os.path.dirname(os.path.abspath(__file__))  # D:\project_2\python-process
    embeddings_file = os.path.join(script_dir, embeddings_file)# D:\project_2\python-process\embeddings.npy
    try:
        embeddings_dict = np.load(embeddings_file, allow_pickle=True).item()
        print(embeddings_dict)
    except FileNotFoundError:
        embeddings_dict = {}
    script_dir = os.path.dirname(os.path.abspath(__file__))# folder cha của file hiện tại
    folder_video_path = os.path.join(script_dir, "face_extracted") #D:\project_2\python-process\face_extracted
    new_person_path = os.path.join(folder_video_path, person_name)
    if person_name in embeddings_dict:
        print(f"{person_name} already exists. Use update_person to modify.")
        return embeddings_dict

    embeddings = []
    new_person_path = Path(new_person_path)
    # new_person_path = os.path.join(foler_video_path, name)
    if new_person_path.is_dir():
        for img_path in new_person_path.glob("*.jpg"):
            try:
                embedding = DeepFace.represent(
                    img_path=str(img_path),
                    model_name=model_name,#Facenet512
                    detector_backend="mtcnn", # Bộ phát hiện khuôn mặt (ở đây dùng MTCNN) 
                    enforce_detection=True #Nếu không phát hiện khuôn mặt thì báo lỗi
                )
                embeddings.append(embedding[0]["embedding"]) # lấy khuôn mặt đầu tiên, thường chỉ có một khuôn mặt 
            except Exception as e:
                print(f"Error processing {img_path}: {e}")
                continue
    else:
        try:
            embedding = DeepFace.represent(
                img_path=str(new_person_path),
                model_name=model_name,
                detector_backend="mtcnn",
                enforce_detection=True
            )
            embeddings.append(embedding[0]["embedding"])
        except Exception as e:
            print(f"Error processing {new_person_path}: {e}")
            # return embeddings_dict

    if embeddings:
        avg_embedding = np.mean(embeddings, axis=0)
        embeddings_dict[person_name] = avg_embedding
        np.save(embeddings_file, embeddings_dict, allow_pickle=True)
        print(f"Added {person_name} with {len(embeddings)} images")
    else:
        print(f"No valid embeddings for {person_name}")

    return embeddings_dict


def update_person(person_name, new_person_path, embeddings_file="embeddings.npy", model_name="Facenet512"):
    try:
        embeddings_dict = np.load(embeddings_file, allow_pickle=True).item()
    except FileNotFoundError:
        print(f"{embeddings_file} not found")
        return {}
    
    if person_name not in embeddings_dict:
        print(f"{person_name} not found. Use add_person to add new person.")
        return embeddings_dict
    
    embeddings = []
    new_person_path = Path(new_person_path)
    
    if new_person_path.is_dir():
        for img_path in new_person_path.glob("*.jpg"):
            try:
                embedding = DeepFace.represent(
                    img_path=str(img_path),
                    model_name=model_name,
                    detector_backend="mtcnn",
                    enforce_detection=True
                )
                embeddings.append(embedding[0]["embedding"])
            except Exception as e:
                print(f"Error processing {img_path}: {e}")
                continue
    else:
        try:
            embedding = DeepFace.represent(
                img_path=str(new_person_path),
                model_name=model_name,
                detector_backend="mtcnn",
                enforce_detection=True
            )
            embeddings.append(embedding[0]["embedding"])
        except Exception as e:
            print(f"Error processing {new_person_path}: {e}")
            return embeddings_dict

    if embeddings:
        avg_embedding = np.mean(embeddings, axis=0)
        embeddings_dict[person_name] = avg_embedding
        np.save(embeddings_file, embeddings_dict, allow_pickle=True)
        print(f"Updated {person_name} with {len(embeddings)} images")
    else:
        print(f"No valid embeddings for {person_name}")

    return embeddings_dict

import json


def delete_person(id,embeddings_file="embeddings.npy"):
    script_dir = os.path.dirname(os.path.abspath(__file__))
    embeddings_file = os.path.join(script_dir,"embeddings.npy")

    try:
        embeddings_dict = np.load(embeddings_file, allow_pickle=True).item()
        print(embeddings_dict)
    except FileNotFoundError:
        print(f"{embeddings_file} not found")
        return {}
    # Vì json.dumps(...) không thể encode np.array nên phải chuyển về list.
    removeId = id
    if removeId in embeddings_dict:
        del embeddings_dict[removeId]

    np.save(embeddings_file,embeddings_dict)
    
    result = {k: v.tolist() for k, v in embeddings_dict.items()}
    print(json.dumps(result))