import os
import json
import numpy as np 

def export_embeddings():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    file_path = os.path.join(script_dir,"embeddings.npy")

    if not os.path.exists(file_path):
        print(json.dumps({}))
        return

    data = np.load(file_path, allow_pickle=True).item()
    # Vì json.dumps(...) không thể encode np.array nên phải chuyển về list.
    result = {k: v.tolist() for k, v in data.items()}
    print(json.dumps(result))
    
    
