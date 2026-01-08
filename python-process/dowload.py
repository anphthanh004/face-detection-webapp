import cloudinary
import cloudinary.api
import requests
import os
from dotenv import load_dotenv

load_dotenv()

cloud_name = os.getenv("CLOUDINARY_NAME")
api_key = os.getenv("CLOUDINARY_API_KEY")
api_secret = os.getenv("CLOUDINARY_API_SECRET")

cloudinary.config(
    cloud_name=cloud_name,
    api_key=api_key,
    api_secret=api_secret
)
# def download_video(public_id, output_folder):
#     url = f"https://res.cloudinary.com/{cloudinary.config().cloud_name}/video/upload/fl_attachment/{public_id}.mp4"
#     response = requests.get(url)
#     if response.status_code == 200:
#         os.makedirs(output_folder, exist_ok=True)
#         output_path = os.path.join(output_folder, f"{public_id}.mp4")
#         with open(output_path, "wb") as f:
#             f.write(response.content)
#         print(f"Downloaded {public_id}.mp4")
#     else:
#         print(f"Failed to download {public_id}")
        
# result = cloudinary.api.resources(
#     resource_type="video",
#     max_results=500  
# )
# videos = result["resources"]
# script_dir = os.path.dirname(os.path.abspath(__file__))
# output_folder = os.path.join(script_dir, "downloaded_videos")
# for video in videos:
#     download_video(video["public_id"], output_folder)


def download_video(public_id, output_folder, filename):
    url = f"https://res.cloudinary.com/{cloudinary.config().cloud_name}/video/upload/fl_attachment/{public_id}.mp4"
    response = requests.get(url)
    if response.status_code == 200:
        os.makedirs(output_folder, exist_ok=True)
        output_path = os.path.join(output_folder, f"{filename}.mp4")
        with open(output_path, "wb") as f:
            f.write(response.content)
        print(f"Downloaded {filename}.mp4")
    else:
        print(f"Failed to download {public_id}")


# def download_all_videos(output_folder):
#     result = cloudinary.api.resources(
#         resource_type="video",
#         max_results=500
#     )
#     videos = result.get("resources", [])
#     for video in videos:
#         public_id = video["public_id"]
#         if public_id.startswith("accepted_videos/"):
#             filename = public_id.split("accepted_videos/")[1]  
#             download_video(public_id, output_folder, filename)

def download_all_videos(output_folder, phone_ids=None):
    if phone_ids is None:
        result = cloudinary.api.resources(resource_type="video", max_results=500)
        videos = result.get("resources", [])
        for video in videos:
            public_id = video["public_id"]
            if public_id.startswith("accepted_videos/"):
                filename = public_id.split("accepted_videos/")[1]
                download_video(public_id, output_folder, filename)
    else:
        for phone in phone_ids:
            public_id = f"accepted_videos/{phone}"
            filename = phone
            download_video(public_id, output_folder, filename)

