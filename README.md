# Simple A2A Orchestration

This project enables two autonomous agents (A2A servers) to converse with each other.
It's just a vibe-coded proof of concept exploring the A2A protocol

## Usage

Install dependencies:
```sh
npm install
```

Run the conversation script (example):
```sh
npx tsx src/cli.ts \
    --agent1=http://localhost:3001 \
    --agent2=http://localhost:3002 \
    --init-message="Hello!" \
    --max-turns=10
```

## Arguments
- `--agent1` (required): URL of the first agent (A2A server)
- `--agent2` (required): URL of the second agent (A2A server)
- `--init-message` (required): Initial message to start the conversation
- `--max-turns` (optional, default: 10): Maximum number of conversation turns


## Examples

In the following examples, we'll use [simple-a2a-agent](https://github.com/ericabouaf/simple-a2a-agent) to quickly launch A2A Agents (not very capable, just role-playing).

**Note**: each command must be run in a separate terminal
**Note**: Don't forget to export `OPENAI_API_KEY` for the simple-a2a-agent agents

### Neo & Morpheus

```sh
npx simple-a2a-agent \
    --name "Neo" \
    --description "You are Neo, the character from Matrix, meeting Morpheus for the first time." \
    --llm-provider openai \
    --llm-model gpt-4o-mini \
    --port 9018

npx simple-a2a-agent \
    --name "Morpheus" \
    --description "You are Morpheus, the character from Matrix, speaking to Neo for the first time." \
    --llm-provider openai \
    --llm-model gpt-4o-mini \
    --port 2069


npx tsx src/cli.ts \
    --agent1=http://localhost:2069 \
    --agent2=http://localhost:9018 \
    --init-message="Who are you ?" \
    --max-turns=10
```


### Shūsaku & Hikaru

```sh
npx simple-a2a-agent \
    --name "Shūsaku" \
    --description "You are Hon'inbō Shūsaku, the Japanese professional Go player, speaking with a young boy who wants to learn go. Introduce him to go concepts one by one, (one new concept only in each reply) and wait for acknoledgment or the next question. Don't draw boards." \
    --llm-provider openai \
    --llm-model gpt-4o-mini \
    --port 1829

npx simple-a2a-agent \
    --name "Hikaru" \
    --description "You are Hikaru, a young boy willing to learn go, the board game." \
    --llm-provider openai \
    --llm-model gpt-4o-mini \
    --port 1862


npx tsx src/cli.ts \
    --agent1=http://localhost:1829 \
    --agent2=http://localhost:1862 \
    --init-message="Where do we begin ?" \
    --max-turns=10
```

