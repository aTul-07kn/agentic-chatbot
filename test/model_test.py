import os
from agno.agent import Agent
from agno.team.team import Team
from textwrap import dedent
from dotenv import load_dotenv
# from agno.models.nvidia import Nvidia
from agno.tools import tool
# from agno.tools.duckduckgo import DuckDuckGoTools
# from agno.models.openrouter import OpenRouter
from agno.models.google import Gemini
from agno.tools.googlesearch import GoogleSearchTools
from agno.tools.tavily import TavilyTools

# Load environment variables from .env file
load_dotenv()

# Initialize Gemini model with API key
model = Gemini(id="gemini-2.0-flash", api_key=os.getenv("GENIMI_API_KEY"))

TAVILY_API_KEY = os.getenv("TAVILY_API_KEY")

# Agent 1: Detects predominant emotion from the passage
emotion_agent= Agent(
    name="Emotion Agent",
    role="Find the emotion of the given passage",
    model=model,
    description="You are an emotion recognition agent which recognizes the emotion conveyed by the given passage",
    instructions=[
        "Given a passage by the user, identify the emotion of the given passage",
        "Give only the emotion as the output and nothing else",
        "The emotion can be e.g., joy, sadness, anger, or any other",
        "Keep the emotions generic dont be too detailed about the emotions",
    ],
    debug_mode=True,
    markdown=True,
)

# Agent 2: Identifies books that may contain the given passage
book_agent = Agent(
    name="Book Agent",
    role="search online books for the passage",
    model=model,
    tools=[GoogleSearchTools()],
    # tools = [TavilyTools(api_key=TAVILY_API_KEY)],
    description="You are a book finding agent which returns one or more books the passage belongs to",
    instructions=[
        "Given a passage by the user, respond with to which book the passage belongs to.",
        "There can be one or more books the passage belongs to",
        "Search for all the books and give the relavant books",
        "Give only the names of the books and nothing else as output",
    ],
    show_tool_calls=True,
    debug_mode=True,
    markdown=True,
)

# Agent 3: Generates a 2-3 sentence summary of the passage
summary_agent= Agent(
    name="Summary Agent",
    role="Generate the summary of the given passage",
    model=model,
    description="You are a summary generation agent which generates the summary of the given passage",
    instructions=[
        "Given a passage by the user, generate the summary for the given passage",
        "Generate the summary in 2-3 sentences",
        "Analyse the entire passage clearly and generate the summary",
    ],
    debug_mode=True,
    markdown=True,
)

character_agent= Agent(
    name="Character Agent",
    role="Identifies the characters in the given passage",
    model=model,
    description="You are a character agent which identifies the characters in the given passage",
    instructions=[
        "Given a passage by the user, identify the characters in that passage",
        "Go through the entire passage to get the characters properly",
        "Give the character names in the format of [character1 name], [character2 name],..."
    ],
    debug_mode=True,
    markdown=True,
)

# Team coordinates the three agents to analyze the passage
team = Team(
    name="Passage Analysis Team",
    mode="coordinate",
    model=model,
    members=[emotion_agent, book_agent, summary_agent, character_agent],
    description="Analyses the passage and follow identifies the emotion from the passage, then identifies the books the passage belongs to and then summarizes the passage",
    instructions = dedent("""
    You lead a team of agents which analyzes the given passage and does a sequence of tasks, each agent has a unique role:

    1. 'Emotion Agent' - Detects the predominant emotion conveyed in the passage.
    2. 'Book Agent' - Analyzes the style and content to suggest which 2-3 books the passage might belong to.
    3. 'Summary Agent' - Summarizes the passage in 2-3 clear, engaging sentences.
    4. 'Character Agent' - Identifies the characters in the passage
    
    The Workflow is:
    'Emotion Agent' -> 'Book Agent' -> 'Summary Agent' -> 'Character Agent'
    
    Work collaboratively to deliver a well-rounded analysis of the input and make sure they give the responses back.
    Respond in warm, professional language, tailored to the user's tone.
    """),
    show_tool_calls=True,
    expected_output="""
        1. Total Word Count:
        The passage contains XX words.

        2. Predominant Emotion:
        The main emotion conveyed in the passage is: [Emotion]

        3. Possible Source Books:
        Based on the style and content, the passage might be from one of the following:

        [Book Title 1]
        
        (Optional: [Book Title 2])

        (Optional: [Book Title 3])

        4. Summary of the Passage:
        [Brief 2-3 sentence summary here. Focus on the main idea, tone, or plot hints.]
        
        5. Characters in the passage:
        The identified characters in the passage are:
        [Character1 name]
        [Character2 name] (optional)
        [Character3 name] (optional)
    """,
    markdown=True,
    debug_mode=True,
    enable_agentic_context=True,
)

# Function to compute word count and invoke the team to analyze the passage
def get_output(inp_text):
    word_count = len(inp_text.split())
    query = f"""Total number of words in paragraph: {word_count}
    Paragraph : 
    {inp_text}
    """
    response=team.run(message=query) # Calls the team for the response
    print(response.messages[-1].content)

# Input passage
# Paste the passage as a single line while executing
input_text=input("Enter a passage:\n")

get_output(input_text)