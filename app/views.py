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
    request.session.flush()  # Clear the session on a new visit
    return render(request, "home.html")


@csrf_exempt
def chat_api(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            user_message = data.get("message", "")
            prd_content = data.get("prd", "")

            if not user_message:
                return JsonResponse({"error": "No message provided"}, status=400)

            # Retrieve or initialize conversation history from the session
            conversation = request.session.get("conversation", [])

            if prd_content:
                conversation.append({"role": "user", "content": user_message, "prd": prd_content})
            else:
                conversation.append({"role": "user", "content": user_message, "prd": ""})

            headers = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {OPENAI_API_KEY}",
            }

            payload = {
                "model": "gpt-3.5-turbo",
                "messages": conversation,
                "stream": True,
            }

            def generate_response():
                try:
                    with requests.post(
                        OPENAI_API_URL, headers=headers, json=payload, stream=True
                    ) as r:
                        r.raise_for_status()
                        assistant_message = ""
                        for line in r.iter_lines():
                            if line:
                                decoded_line = line.decode('utf-8')
                                if decoded_line.startswith("data:"):
                                    json_data = decoded_line[len("data:") :].strip()
                                    if json_data == "[DONE]":
                                        break
                                    try:
                                        data = json.loads(json_data)
                                        if "choices" in data and len(data["choices"]) > 0:
                                            delta = data["choices"][0].get("delta", {})
                                            if "content" in delta:
                                                content = delta["content"]
                                                assistant_message += content
                                                yield content
                                    except json.JSONDecodeError:
                                        continue
                        
                        # Save the assistant's response to the session
                        conversation.append({"role": "assistant", "content": assistant_message})
                        request.session["conversation"] = conversation

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
            request.session["notes"] = notes_content
            return JsonResponse({"content": notes_content})
        except json.JSONDecodeError:
            return JsonResponse({"error": "Invalid JSON"}, status=400)
    return JsonResponse({"error": "Only POST requests are allowed"}, status=405)


from django.http import JsonResponse
from django.utils import timezone

def reset_session_timeout(request):
    request.session.set_expiry(request.session.get_expiry_age())
    expiry_date = request.session.get_expiry_date()
    if isinstance(expiry_date, str):
        expiry_date = timezone.datetime.fromisoformat(expiry_date.replace('Z', '+00:00'))
    remaining_seconds = (expiry_date - timezone.now()).total_seconds()
    return JsonResponse({'remaining_seconds': remaining_seconds})


def session_info_api(request):
    if not request.session.session_key:
        request.session.create()
    
    expiry_age = request.session.get_expiry_age()
    expiry_date = request.session.get_expiry_date()

    if isinstance(expiry_date, str):
        expiry_date = timezone.datetime.fromisoformat(expiry_date.replace('Z', '+00:00'))

    remaining_seconds = (expiry_date - timezone.now()).total_seconds()

    return JsonResponse({
        'expiry_age': expiry_age,
        'remaining_seconds': remaining_seconds,
    })

@csrf_exempt
def get_history_api(request):
    if request.method == "GET":
        conversation = request.session.get("conversation", [])
        return JsonResponse({"history": conversation})
    return JsonResponse({"error": "Only GET requests are allowed"}, status=405)
