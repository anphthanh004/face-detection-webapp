import numpy as np
from scipy.spatial.distance import cosine
from deepface import DeepFace

def find_closest_person(new_img_path, embeddings_dict, model_name="Facenet512", threshold=0.3):
    try:
        new_embedding = DeepFace.represent(
            img_path=new_img_path,
            model_name=model_name,
            detector_backend="mtcnn",
            enforce_detection=True
        )[0]["embedding"]
    except Exception as e:
        print(f"Error processing {new_img_path}: {e}")
        return None, None
    valid_embeddings = {}
    for phone, embedding in embeddings_dict.items():
        if isinstance(embedding, list) and len(embedding) == 512:
            valid_embeddings[phone] = np.array(embedding, dtype=np.float32)
        else:
            print(f"Skipping invalid embedding for {phone}: length={len(embedding) if isinstance(embedding, list) else 'not a list'}")

    if not valid_embeddings:
        print("No valid embeddings found")
        return None, None
    min_dist = float("inf")
    closest_person = None
    for person, emb in valid_embeddings.items():
        dist = cosine(new_embedding, emb)
        if dist < min_dist:
            min_dist = dist
            closest_person = person
    if min_dist <= threshold:
        return closest_person, min_dist
    else:
        print(f"No match found (min_dist {min_dist} > threshold {threshold})")
        return None, None