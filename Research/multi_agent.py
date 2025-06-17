import json
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Dict, List, Optional, Any, Callable
from datetime import date
from agno.agent import Agent 
from agno.tools import tool
from agno.models.nvidia import Nvidia
from agno.models.openrouter import OpenRouter
import os
import uuid
from dotenv import load_dotenv
from textwrap import dedent
from agno.memory.v2.memory import Memory
from agno.memory.v2.db.sqlite import SqliteMemoryDb
from agno.storage.sqlite import SqliteStorage
from fastapi.middleware.cors import CORSMiddleware
from agno.tools.duckduckgo import DuckDuckGoTools
from agno.tools.pubmed import PubmedTools
from agno.team import Team
from agno.eval.accuracy import AccuracyEval
import re
import random
import string
import mysql.connector
import asyncio
from mysql.connector import Error
from agno.models.google import Gemini

today = date.today().isoformat()

# Load environment variables from .env file
load_dotenv()

NVIDIA_API_KEY=os.getenv("NVIDIA_API_KEY")
if not NVIDIA_API_KEY:
    raise ValueError("NVIDIA_API_KEY is not set in the environment variables.")

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
if not OPENROUTER_API_KEY:
    raise ValueError("OPENROUTER_API_KEY is not set in the environment variables.")

GEMINI_API_KEY = os.getenv("GENIMI_API_KEY")
if not GEMINI_API_KEY:
    raise ValueError("GENIMI_API_KEY is not set in the environment variables.")

memory_db = SqliteMemoryDb(
    table_name="memories",
    db_file="test_memory/memory.db"
)

# Initialize Memory with the storage backend
memory = Memory(db=memory_db)

storage=SqliteStorage(
        table_name="team_sessions", db_file="test_storage/data.db", auto_upgrade_schema=True
    )

reddit_researcher = Agent(
    name="Reddit Researcher",
    role="Research a topic on Reddit",
    # model=Nvidia(id="meta/llama3-70b-instruct", api_key=NVIDIA_API_KEY),
    model=Gemini(id="gemini-2.0-flash", api_key=GEMINI_API_KEY),
    tools=[DuckDuckGoTools(cache_results=True)],
    add_name_to_instructions=True,
    instructions=dedent("""
    You are a Reddit researcher.
    You will be given a topic to research on Reddit.
    You will need to find the most relevant information on Reddit.
    """),
    add_datetime_to_instructions=True,
)

# Writer agent that can write content
medical_agent = Agent(
    name="Medical Agent",
    role="Write content",
    # model=Nvidia(id="meta/llama3-70b-instruct", api_key=NVIDIA_API_KEY),
    model=Gemini(id="gemini-2.0-flash", api_key=GEMINI_API_KEY),
    description="You are an AI agent that can write content.",
    tools=[PubmedTools()],
    instructions=[
        "You are a medical agent that can answer questions about medical topics.",
    ],
)

# def giveUserDetails(team: Team):
#     return team.team_session_state.get("user_details", "No user details found.")

# def give_user(agent: Agent):
#     name=agent.team_session_state["user_details"]["name"]

    # print("the name of the user is ----", name)

faq_agent = Agent(
    name="FAQ Agent",
    role="Handles general inquiries",
    # model=Nvidia(id="meta/llama3-70b-instruct", api_key=NVIDIA_API_KEY),
    model=Gemini(id="gemini-2.0-flash", api_key=GEMINI_API_KEY),
    description="Answers general questions about STRIKIN facilities and services",
    instructions=dedent(f"""\
        Today is {today}.
        Answer questions about:
        - Greetings and welcome message
        - Operating hours: 10AM-10PM daily
        - Location: Hyderabad 
        - Pricing: Golf ₹1200/hr, Cricket ₹1500/hr
        - Amenities: Bar, coaching, events
        - Contact: +91-1234567890
        - Booking process
        - Any other general inquiries
        - Answer anything about the user related queries
        
        Keep responses concise (1-2 sentences).
        For booking requests, politely direct to booking process.
        Use markdown formatting."""),
    tools=[],
    markdown=True,
    show_tool_calls=True,
    add_datetime_to_instructions=True,
)

agent_team = Team(
    name="Multi-Purpose Team",
    mode="coordinate",
    description="A team of agents for an organisation called STRIKIN that can answer a variety of questions regarding it",
    # model=Nvidia(id="meta/llama3-70b-instruct", api_key=NVIDIA_API_KEY),
    model=Gemini(id="gemini-2.0-flash", api_key=GEMINI_API_KEY),
    reasoning_model=OpenRouter(
        id="qwen/qwen3-32b:free",
        api_key=OPENROUTER_API_KEY,
    ),
    members=[
        reddit_researcher,
        medical_agent,
        faq_agent,
    ],
    tools=[],
    instructions=[
        "i am {name}",
        "You are a team of agents that can answer a variety of questions.",
        "You can use your member agents to answer the questions.",
        "You can also answer directly, you don't HAVE to forward the question to a member agent.",
        "Reason about more complex questions before delegating to a member agent.",
        "If the user is only being conversational, then try using the faq_agent and answer directly.",
    ],
    memory=memory,
    storage=storage,
    team_session_state={},
    markdown=True,
    show_tool_calls=True,
    show_members_responses=True,
    enable_agentic_context=True,
    enable_user_memories=True,
    share_member_interactions=True,
    enable_session_summaries=True,
    add_state_in_messages=True,
    # debug_mode=True,
    add_history_to_messages=True,
    add_datetime_to_instructions=True,
)


# def update_session():
#     global global_state
#     global_state["user_datails"]={"name": "atul", "age":22}
#     print("user details updated", global_state["user_details"])    
# update_session()
    
agent_team.session_id="a"
agent_team.team_session_state={"name": "niraj"}

print("session state:", agent_team.team_session_state)
response = agent_team.run("what is my name", user_id="u4",session_id="a")

accuracyTeam = AccuracyEval()

print("session state:", agent_team.team_session_state)
# print(agent_team.run("i like roti", user_id="u4").content)

# agent_team.session_id="b"
# agent_team.team_session_state={"name": "sandeep"}
# print("session state:", agent_team.team_session_state)
# print(agent_team.run("what is my name", user_id="u5").content)
# print(agent_team.run("what i like", user_id="u5").content)

# agent_team.session_id="a"
# print("session state:", agent_team.team_session_state)
# print(agent_team.run("what i like", user_id="u6").content)
# print("session state:", agent_team.team_session_state)
# print(agent_team.run("who am i", user_id="u6",session_id="a").content)

