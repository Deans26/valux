import subprocess
result = subprocess.run(["npx", "tsc", "--noEmit", "--skipLibCheck"], 
    capture_output=True, text=True, cwd=".")
print(result.stdout[:3000])
print(result.stderr[:3000])