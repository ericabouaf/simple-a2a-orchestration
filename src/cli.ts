import { Command } from 'commander';
import { A2AClient } from './lib/a2a/client/client.js';
import { v4 as uuidv4 } from 'uuid';
import { Message } from './lib/a2a/schema.js';
import chalk from 'chalk';

const program = new Command();

program
  .requiredOption('--agent1 <url>', 'URL of the first agent (A2A server)')
  .requiredOption('--agent2 <url>', 'URL of the second agent (A2A server)')
  .option('--init-message <message>', 'Initial message to start the conversation')
  .option('--max-turns <number>', 'Maximum number of conversation turns', '10');

program.parse(process.argv);

const options = program.opts();

console.log('Parsed arguments:');
console.log(`Agent 1 URL: ${options.agent1}`);
console.log(`Agent 2 URL: ${options.agent2}`);
console.log(`Init message: ${options.initMessage ?? '(none)'}`);
console.log(`Max turns: ${options.maxTurns}`);

// Instantiate A2A clients
const agent1Client = new A2AClient(options.agent1);
const agent2Client = new A2AClient(options.agent2);

console.log('A2A clients instantiated:');
console.log(`- Agent 1 client base URL: ${options.agent1}`);
console.log(`- Agent 2 client base URL: ${options.agent2}`);

function getTextFromParts(parts: Message['parts']): string {
  return parts
    .map((p) => {
      if (p.type === 'text' || !('type' in p)) {
        // If type is missing, treat as text for backward compatibility
        // @ts-ignore
        return p.text;
      }
      return `[${p.type ?? 'unknown'} part]`;
    })
    .join(' ');
}

async function main() {
  // Fetch and log agent cards before starting the conversation
  let agent1Name = 'Agent 1';
  let agent2Name = 'Agent 2';
  // Assign unique colors for each agent
  const agent1Color = chalk.cyan;
  const agent2Color = chalk.yellow;
  try {
    const [agent1Card, agent2Card] = await Promise.all([
      agent1Client.agentCard(),
      agent2Client.agentCard(),
    ]);
    agent1Name = agent1Card?.name || agent1Name;
    agent2Name = agent2Card?.name || agent2Name;
    console.log(`\n${agent1Name} Card:`, JSON.stringify(agent1Card, null, 2));
    console.log(`${agent2Name} Card:`, JSON.stringify(agent2Card, null, 2));
  } catch (err) {
    console.error('Failed to fetch agent card(s):', err);
    process.exit(1);
  }

  const maxTurns = parseInt(options.maxTurns, 10);
  let currentTurn = 0;
  let lastMessage: Message | undefined;
  let lastSender = 'user';

  // Start with the init message if provided
  if (options.initMessage) {
    lastMessage = {
      role: 'user',
      parts: [{ type: 'text', text: options.initMessage }],
    };
    console.log(`\n${chalk.green(`[User -> ${agent1Name}]`)}: ${options.initMessage}`);
  } else {
    console.log('\nNo initial message provided. Exiting.');
    process.exit(1);
  }

  let agent1SessionId: string | undefined = undefined;
  let agent2SessionId: string | undefined = undefined;
  // Generate a single taskId for the whole conversation
  const conversationTaskId = uuidv4();

  while (currentTurn < maxTurns) {
    // Agent 1's turn (if first turn, user already sent message to agent 1)
    const agent1Params = {
      id: conversationTaskId,
      message: lastMessage!,
      sessionId: agent1SessionId ?? undefined,
    };
    const agent1Task = await agent1Client.sendTask(agent1Params);
    agent1SessionId = agent1Task?.sessionId ?? undefined;
    const agent1Reply = agent1Task?.status?.message;
    if (!agent1Reply) {
      console.log(agent1Color(`[${agent1Name}] No reply. Ending conversation.`));
      break;
    }
    console.log('\n');
    console.log(
      agent1Color(
        `[${agent1Name}]: ${getTextFromParts(agent1Reply.parts)}`
      )
    );

    // Agent 2's turn
    const agent2Params = {
      id: conversationTaskId,
      message: agent1Reply,
      sessionId: agent2SessionId ?? undefined,
    };
    const agent2Task = await agent2Client.sendTask(agent2Params);
    agent2SessionId = agent2Task?.sessionId ?? undefined;
    const agent2Reply = agent2Task?.status?.message;
    if (!agent2Reply) {
      console.log(agent2Color(`[${agent2Name}] No reply. Ending conversation.`));
      break;
    }
    console.log('\n');
    console.log(
      agent2Color(
        `[${agent2Name}]: ${getTextFromParts(agent2Reply.parts)}`
      )
    );

    // Prepare for next turn
    lastMessage = agent2Reply;
    currentTurn++;
  }

  console.log(`\nConversation ended after ${currentTurn} turns.`);
}

main().catch((err) => {
  console.error('Error in conversation loop:', err);
  process.exit(1);
}); 