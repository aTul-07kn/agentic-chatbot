# from agno.agent import Agent
# from agno.models.nvidia import Nvidia
# import os
# from dotenv import load_dotenv
# load_dotenv()

# NVIDIA_API_KEY=os.getenv("NVIDIA_API_KEY")
# if not NVIDIA_API_KEY:
#     raise ValueError("NVIDIA_API_KEY is not set in the environment variables.")



# agent = Agent(
#     model=Nvidia(id="meta/llama3-70b-instruct", api_key=NVIDIA_API_KEY),
#     markdown=True,
# )
# agent.print_response("What is the color of sky", stream=True)



import json
import httpx
import os
from agno.agent import Agent
from dotenv import load_dotenv
from agno.models.nvidia import Nvidia
from agno.tools import tool
import random
from agno.tools.duckduckgo import DuckDuckGoTools
from agno.models.openrouter import OpenRouter
from agno.models.google import Gemini

load_dotenv()

NVIDIA_API_KEY=os.getenv("NVIDIA_API_KEY")
if not NVIDIA_API_KEY:
    raise ValueError("NVIDIA_API_KEY is not set in the environment variables.")


@tool(show_result=True, stop_after_tool_call=True)
def get_weather(city: str) -> str:
    """Get the weather for a city."""
    # In a real implementation, this would call a weather API
    weather_conditions = ["sunny", "cloudy", "rainy", "snowy", "windy"]
    random_weather = random.choice(weather_conditions)

    return f"The weather in {city} is {random_weather}."

agent = Agent(
    model=OpenRouter(id="meta-llama/llama-3.3-70b-instruct:free", api_key=os.getenv("OPENROUTER_API_KEY")),
    markdown=True,
    tools=[get_weather], 
    show_tool_calls=True, 
    debug_mode=True,
)

# Using Google AI Studio
agent1 = Agent(
    model=Gemini(id="gemini-2.0-flash", api_key=os.getenv("GENIMI_API_KEY")),
    markdown=True,
)

agent1.print_response("Share a 2 sentence horror story.")

# print(agent.run("Whats weather in France?").content)