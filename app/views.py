import json
import os

import requests
from django.http import JsonResponse, StreamingHttpResponse
from django.shortcuts import render
from django.views.decorators.csrf import csrf_exempt
from django.db import connection

# OpenAI API configuration
OPENAI_API_URL = "https://api.openai.com/v1/chat/completions"
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")


def home(request):
    return render(request, "home.html")


@csrf_exempt
def chat_api(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            user_message = data.get("message", "")
            prd_content = data.get("prd", "")  # Get the prd content

            if not user_message:
                return JsonResponse({"error": "No message provided"}, status=400)

            if prd_content:
                messages = [
                    {"role": "user", "content": user_message, "prd": prd_content}
                ]
            else:
                messages = [{"role": "user", "content": user_message, "prd": ""}]

            headers = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {OPENAI_API_KEY}",
            }

            payload = {
                "model": "gpt-3.5-turbo",  # You can change this to another model like "gpt-4"
                "messages": messages,
                "stream": True,
            }

            print("OpenAI Request Headers:", headers)  # Debugging line
            print("OpenAI Request Payload:", payload)  # Debugging line

            def generate_response():
                try:
                    with requests.post(
                        OPENAI_API_URL, headers=headers, json=payload, stream=True
                    ) as r:
                        r.raise_for_status()  # Raise an exception for HTTP errors
                        for chunk in r.iter_content(chunk_size=8192):
                            # Each chunk might contain multiple SSE events or partial events
                            # We need to parse them to extract the 'data' field
                            for line in chunk.decode("utf-8").splitlines():
                                if line.startswith("data:"):
                                    json_data = line[len("data:") :].strip()
                                    if json_data == "[DONE]":
                                        break
                                    try:
                                        data = json.loads(json_data)
                                        if (
                                            "choices" in data
                                            and len(data["choices"]) > 0
                                        ):
                                            delta = data["choices"][0].get("delta", {})
                                            if "content" in delta:
                                                yield delta["content"]
                                    except json.JSONDecodeError:
                                        # Handle incomplete JSON objects or other parsing errors
                                        continue
                except requests.exceptions.RequestException as e:
                    yield f"Error connecting to OpenAI: {str(e)}"
                except Exception as e:
                    yield f"An unexpected error occurred: {str(e)}"

            return StreamingHttpResponse(generate_response(), content_type="text/plain")

        except json.JSONDecodeError:
            return JsonResponse({"error": "Invalid JSON"}, status=400)
    return JsonResponse({"error": "Only POST requests are allowed"}, status=405)


@csrf_exempt
def update_notes_api(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            notes_content = data.get("notes", "")
            return JsonResponse({"content": notes_content})
        except json.JSONDecodeError:
            return JsonResponse({"error": "Invalid JSON"}, status=400)
    return JsonResponse({"error": "Only POST requests are allowed"}, status=405)


@csrf_exempt
def get_history_api(request):
    if request.method == "GET":
        user_id = request.GET.get("userId")
        if not user_id:
            return JsonResponse({"error": "userId not provided"}, status=400)

        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT user_id, title, content FROM prdai.history WHERE user_id = %s", [user_id])
                rows = cursor.fetchall()
                history_data = []
                for row in rows:
                    history_data.append({"user_id": row[0], "title": row[1], "content": row[2]})
            return JsonResponse({"history": history_data})
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)
    return JsonResponse({"error": "Only GET requests are allowed"}, status=405)
