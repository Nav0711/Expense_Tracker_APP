import os
import requests
import time

HF_API_KEY = os.getenv("HF_API_KEY")
HF_MODEL = os.getenv("HF_MODEL", "gpt2")  # Using more reliable model

def generate_rule_based_insight(summary: str, expected: float, actual: float, savings: float, overspend_days: int, by_cat: dict) -> str:
    """Fallback rule-based insight generator."""
    insights = []
    
    if savings > 0:
        insights.append(f"Great job! You saved ${savings:.2f}.")
    elif savings < 0:
        insights.append(f"You overspent by ${abs(savings):.2f}.")
    else:
        insights.append("You stayed exactly on budget!")
    
    if overspend_days > 0:
        insights.append(f"Consider tracking daily expenses - you overspent on {overspend_days} day(s).")
    
    if by_cat:
        highest_cat = max(by_cat, key=by_cat.get)
        insights.append(f"Your biggest expense category is {highest_cat} (${by_cat[highest_cat]:.2f}).")
    
    return " ".join(insights)

def ai_insight(summary: str) -> str:
    """Generate a short financial insight using Hugging Face Inference API with fallback."""
    if not HF_API_KEY:
        return "AI insight unavailable: Missing HF_API_KEY in environment."

    url = f"https://api-inference.huggingface.co/models/{HF_MODEL}"
    headers = {"Authorization": f"Bearer {HF_API_KEY}"}
    
    # Create a proper prompt for the model
    prompt = f"Provide a brief financial insight based on this data: {summary}\n\nInsight:"
    payload = {
        "inputs": prompt, 
        "parameters": {
            "max_new_tokens": 50, 
            "temperature": 0.7,
            "do_sample": True
        }
    }

    # Single attempt with quick fallback
    try:
        response = requests.post(url, headers=headers, json=payload, timeout=10)
        print(f"HF API Status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            
            if isinstance(result, list) and len(result) > 0:
                if "generated_text" in result[0]:
                    generated = result[0]["generated_text"].strip()
                    # Clean up the response
                    if prompt in generated:
                        generated = generated.split(prompt)[-1].strip()
                    return generated if generated else "Keep tracking your expenses!"
                elif "error" in result[0]:
                    print(f"HF Error: {result[0]['error']}")
        
        # If we reach here, fall back to rule-based
        return "AI service temporarily unavailable. Keep monitoring your spending patterns!"
        
    except Exception as e:
        print(f"HF API Exception: {str(e)}")
        # Return a simple fallback message
        return "Keep tracking your expenses for better financial insights!"


# Enhanced version that extracts data from summary for rule-based insights
def ai_insight_enhanced(summary: str, expected: float = None, actual: float = None, 
                       savings: float = None, overspend_days: int = None, by_cat: dict = None) -> str:
    """Enhanced version with rule-based fallback using actual data."""
    
    # Try AI first
    ai_result = ai_insight(summary)
    
    # If AI failed and we have the data, use rule-based approach
    if ("unavailable" in ai_result.lower() or "temporarily" in ai_result.lower()) and all(v is not None for v in [expected, actual, savings]):
        return generate_rule_based_insight(summary, expected, actual, savings, overspend_days or 0, by_cat or {})
    
    return ai_result