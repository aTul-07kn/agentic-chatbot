from agno.agent import Agent
from agno.models.openai import OpenAIChat
from agno.team import Team
from agno.tools.duckduckgo import DuckDuckGoTools
from agno.models.nvidia import Nvidia
import os
from dotenv import load_dotenv
load_dotenv()

NVIDIA_API_KEY=os.getenv("NVIDIA_API_KEY")
if not NVIDIA_API_KEY:
    raise ValueError("NVIDIA_API_KEY is not set in the environment variables.")

# Create individual specialized agents
researcher = Agent(
    name="Researcher",
    role="Expert at finding information",
    tools=[DuckDuckGoTools()],
    model=Nvidia(id="mistralai/mixtral-8x7b-instruct-v0.1", api_key=NVIDIA_API_KEY),
    instructions="Find the latest and most reliable information about the given topic. Return a detailed report including key facts, sources, and significance.",
)

writer = Agent(
    name="Writer",
    role="Expert at writing clear, engaging content",
    model=Nvidia(id="mistralai/mixtral-8x7b-instruct-v0.1", api_key=NVIDIA_API_KEY),
    instructions="Write a comprehensive, well-structured article based on the research provided. Include an engaging introduction, informative body, and thoughtful conclusion.",
)

# Create a team with these agents
content_team = Team(
    name="Content Team",
    mode="coordinate",
    members=[researcher, writer],
    instructions=(
        "You are a team that creates high-quality content. When given a topic:\n"
        "1. First have the Researcher find information\n"
        "2. Then have the Writer create an article based on the research\n"
        "3. After receiving the Writer's output, present the final article to the user\n"
        "DO NOT show task assignments or intermediate steps to the user\n"
        "ONLY show the final article output from the Writer"
    ),
    model=Nvidia(id="mistralai/mixtral-8x7b-instruct-v0.1", api_key=NVIDIA_API_KEY),
    markdown=True,
    add_history_to_messages=True,
    num_history_runs=5,
    # show_tool_calls=True,  # Hide intermediate tool calls
    enable_agentic_context=True,  # Allow sharing context between agents
    share_member_interactions=True,  # Share responses between agents
    show_members_responses=False,  # Hide intermediate responses
    debug_mode=True,
)

# Run the team with a task
response = content_team.run(
    "Write a detailed article about the impact of AI on modern education."
).content

print(response)