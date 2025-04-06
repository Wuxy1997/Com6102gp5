from transformers import AutoModelForCausalLM, AutoTokenizer
import torch
import json
import sys

def load_model():
    print("Loading Phi-2 model...", file=sys.stderr)
    # 加载量化模型
    model = AutoModelForCausalLM.from_pretrained(
        "microsoft/phi-2",
        load_in_4bit=True,
        device_map="auto"
    )
    tokenizer = AutoTokenizer.from_pretrained("microsoft/phi-2")
    print("MODEL_READY")
    return model, tokenizer

def generate_response(prompt, model, tokenizer):
    try:
        inputs = tokenizer(prompt, return_tensors="pt", truncation=True, max_length=512)
        outputs = model.generate(
            inputs.input_ids,
            max_length=1024,
            temperature=0.7,
            top_p=0.9,
            num_return_sequences=1,
            pad_token_id=tokenizer.eos_token_id
        )
        response = tokenizer.decode(outputs[0], skip_special_tokens=True)
        return {"text": response}
    except Exception as e:
        return {"error": str(e)}

def main():
    model, tokenizer = load_model()
    
    while True:
        try:
            # 从标准输入读取提示词
            line = sys.stdin.readline()
            if not line:
                break
                
            data = json.loads(line)
            prompt = data["prompt"]
            
            # 生成响应
            response = generate_response(prompt, model, tokenizer)
            
            # 输出 JSON 格式的响应
            print(json.dumps(response))
            sys.stdout.flush()
            
        except Exception as e:
            print(json.dumps({"error": str(e)}))
            sys.stdout.flush()

if __name__ == "__main__":
    main() 