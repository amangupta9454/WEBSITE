import psutil
import platform
import torch
import sys

def bytes_to_gb(bytes):
    return round(bytes / (1024 ** 3), 2)

def main():
    print("========================================")
    print("      CODE-A-NOVA HARDWARE REPORT       ")
    print("========================================")
    
    # OS Info
    print(f"Operating system: {platform.system()} {platform.release()}")
    print(f"OS Version: {platform.version()}")
    
    # CPU Info
    print(f"CPU model: {platform.processor()}")
    print(f"CPU cores/threads: {psutil.cpu_count(logical=False)} / {psutil.cpu_count(logical=True)}")
    
    # RAM
    svmem = psutil.virtual_memory()
    print(f"RAM: {bytes_to_gb(svmem.total)} GB (Available: {bytes_to_gb(svmem.available)} GB)")
    
    # Python & Node
    print(f"Python version: {sys.version.split(' ')[0]}")
    
    # GPU / Torch Info
    print(f"CUDA availability: {torch.cuda.is_available()}")
    if torch.cuda.is_available():
        print(f"CUDA version: {torch.version.cuda}")
        print(f"GPU model: {torch.cuda.get_device_name(0)}")
        print(f"GPU VRAM: {bytes_to_gb(torch.cuda.get_device_properties(0).total_memory)} GB")
    else:
        print("CUDA version: N/A")
        print("GPU model: N/A")
        print("GPU VRAM: N/A")
        
    print(f"MPS (Apple Silicon GPU) availability: {torch.backends.mps.is_available()}")
    if torch.backends.mps.is_available():
        print("MPS is built and available. Will use MPS/CPU depending on module support.")
        
    print("========================================")

if __name__ == '__main__':
    main()
