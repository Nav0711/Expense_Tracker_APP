import os
import openai

openai.api_key = os.getenv("OPENAI_API_KEY")

def ai_insight(summary: str) -> str:
    if not openai.api_key:
        return "(no OPENAI_API_KEY)"
    resp = openai.ChatCompletion.create(
        model="gpt-3.5-turbo",
        messages=[{"role": "user", "content": summary}],
        max_tokens=200,
        temperature=0.3,
    )
    return resp["choices"][0]["message"]["content"].strip()
