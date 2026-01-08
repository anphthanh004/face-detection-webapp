
import numpy as np
import os
import argparse
import json
import sys
from extract_faces import extract_faces_from_video
from crud import add_person, update_person, delete_person
from find_closet import find_closest_person
from dowload import download_all_videos
from export_embeddings import export_embeddings

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--type', type=str, required=True)
    parser.add_argument('--name', type=str)
    parser.add_argument('--num_images', type=int, default=60)
    parser.add_argument('--test_image', type=str)
    parser.add_argument('--new_person_path', type=str)
    parser.add_argument('--ids', type=str)

    args = parser.parse_args()
    script_dir = os.path.dirname(os.path.abspath(__file__))

    ###0###
    if args.type == "download_videos":
        output_folder = os.path.join(script_dir, "downloaded_videos")
        ids = []
        if args.ids:
            ids = json.loads(args.ids)
        download_all_videos(output_folder, ids)
    ###1###
    elif args.type == "extract_faces":
        if not args.name:
            print("Error: --name is required for extract_faces")
            return
        name = args.name
        num_images = args.num_images
        folder_video_path = os.path.join(script_dir, "downloaded_videos")
        faces_output_folder = os.path.join(script_dir, "face_extracted")
        video_path = os.path.join(folder_video_path, f"{name}.mp4")
        output_folder = os.path.join(faces_output_folder, name)
        extract_faces_from_video(video_path, output_folder, num_images, base_name=name)

    ###2###
    elif args.type == "load_embeddings":
        data = np.load("./embeddings.npy", allow_pickle=True).item()
        print(data)
        first_person = next(iter(data))
        print(f"Value of {first_person}:", data[first_person])
        print(f"Shape of {first_person} embedding:", data[first_person].shape)
        print(f"Number of keys in the dictionary: {len(data)}")

    
    ###3###
    elif args.type == "find_closest_person":
        if not args.test_image:
            print("Error: Cần cung cấp --test_image")
            return
        try:
            embeddings_json = sys.stdin.read()
            embeddings_dict = json.loads(embeddings_json) if embeddings_json else {}
        except json.JSONDecodeError as e:
            print(f"Error parsing embeddings JSON: {e}")
            return

        closest_person, distance = find_closest_person(
            args.test_image,
            embeddings_dict,
            model_name="Facenet512",
            threshold=0.3
        )
        if closest_person:
            print(f"Closest match: {closest_person} with distance {distance}")
        else:
            print("No match found")
            
    ###4###
    elif args.type == "add_person":
        name = args.name
        embeddings_file = "embeddings.npy"
        data = add_person(name, embeddings_file)

    ###5###
    elif args.type == "update_person":
        name = args.name
        new_person_path = args.new_person_path
        embeddings_file = "embeddings.npy"
        data = update_person(name, new_person_path, embeddings_file)
    
    ###6###
    elif args.type == "delete_person":
        name = args.name
        embeddings_file = "embeddings.npy"
        data = delete_person(name, embeddings_file)
    
    ###7###
    elif args.type == "export_embeddings":
        export_embeddings()
        

if __name__ == "__main__":
    main()





# python run.py --type "extract_faces" --name "Pham Minh Thong"  
# python run.py --type "get_embeddings"   
# python run.py --type "load_embeddings"  
# cd python-process   
# python run.py --type "find_closest_person" --test_image "D:/project_2/test-35.jpg"
# python run.py --type "add_person" --name "Pham Thanh An" --new_person_path "D:/project_2/python_process/downloaded_videos/Pham Thanh An.mp4" - da ton tai
# python run.py --type "add_person" --name "Pham Thanh An hai" --new_person_path "D:\project_2\python-process\face_extracted\Pham Thanh An"
# python run.py --type "update_person" --name "Pham Thanh An hai" --new_person_path "D:\project_2\python-process\face_extracted\Pham Thanh An"
# python run.py --type "delete_person" --name "Pham Thanh An hai" 

#python run.py --type"download_videos"