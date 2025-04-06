from transformers import AutoModelForCausalLM, AutoTokenizer
from optimum.onnxruntime import ORTModelForCausalLM
import torch
import json
import sys
import os

def load_model():
    print("Loading Phi-2 model...", file=sys.stderr)
    try:
        # First, try to load from cache if exists
        cache_dir = os.path.join(os.path.dirname(__file__), "model_cache")
        os.makedirs(cache_dir, exist_ok=True)

        if os.path.exists(os.path.join(cache_dir, "model.onnx")):
            model = ORTModelForCausalLM.from_pretrained(cache_dir)
            tokenizer = AutoTokenizer.from_pretrained(cache_dir)
        else:
            # Download and convert model
            model_id = "microsoft/phi-2"
            tokenizer = AutoTokenizer.from_pretrained(model_id)
            
            # Convert to ONNX format for better CPU performance
            model = ORTModelForCausalLM.from_pretrained(
                model_id,
                export=True,
                provider="CPUExecutionProvider"
            )
            
            # Save for future use
            model.save_pretrained(cache_dir)
            tokenizer.save_pretrained(cache_dir)

        print("MODEL_READY")
        return model, tokenizer
    except Exception as e:
        print(f"Error loading model: {str(e)}", file=sys.stderr)
        raise

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
            # Read prompt from stdin
            line = sys.stdin.readline()
            if not line:
                break
                
            data = json.loads(line)
            prompt = data["prompt"]
            
            # Generate response
            response = generate_response(prompt, model, tokenizer)
            
            # Output JSON response
            print(json.dumps(response))
            sys.stdout.flush()
            
        except Exception as e:
            print(json.dumps({"error": str(e)}))
            sys.stdout.flush()

if __name__ == "__main__":
    main() 