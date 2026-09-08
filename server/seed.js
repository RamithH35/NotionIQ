import mongoose from 'mongoose';
import { connectDB } from './db.js';
import { Document } from './models/Document.js';
import { Quiz } from './models/Quiz.js';

export async function seed() {
  console.log('[Seed] Connecting to database...');
  await connectDB();

  console.log('[Seed] Removing existing seeded demo documents and quizzes...');
  const oldDemoDocs = await Document.find({ isDemoDoc: true });
  const oldDocIds = oldDemoDocs.map(d => d._id);
  await Quiz.deleteMany({ docId: { $in: oldDocIds } });
  await Document.deleteMany({ isDemoDoc: true });

  console.log('[Seed] Inserting 3 substantive technical demo documents...');

  // 1. Raft Consensus Protocol
  const doc1 = new Document({
    ownerId: null,
    title: 'Raft_Consensus_Protocol.md',
    sourceType: 'md',
    pageCount: 6,
    isDemoDoc: true,
    rawText: `# Raft Consensus Algorithm: Architectural Specification and Formal Invariants

## Abstract
Raft is a consensus algorithm designed as an alternative to Multi-Paxos. It delivers equivalent fault-tolerance, safety properties, and throughput while decomposing the consensus problem into three relatively independent subproblems: Leader Election, Log Replication, and Safety Invariants.

## 1. Cluster State and Role Lifecycle
Every node in a Raft cluster operates in one of three discrete states:
- Follower: Passive responder. Follower nodes process incoming Remote Procedure Calls (RPCs) from active Leaders and Candidates. If a Follower receives no communication (heartbeat AppendEntries) within a randomized election timeout, it assumes the leader has failed and transitions to the Candidate state.
- Candidate: Active election participant. Candidates increment the current term counter, vote for themselves, and broadcast RequestVote RPCs to all peers in parallel.
- Leader: Distinguished coordinator. Handles all client interaction, writes entries to its local append-only log, and synchronizes state across the cluster using AppendEntries RPCs.

## 2. Randomized Election Timeouts and Quorum
Split votes represent a fundamental failure mode where multiple Candidates split the cluster's votes evenly, causing an inconclusive election. Raft resolves this deterministically using randomized election timeouts chosen uniformly from a fixed window (typically 150ms-300ms).
Because timeouts are desynchronized, one node will consistently time out first, increment its term, and gather a majority quorum (N/2 + 1) before competing nodes time out.

## 3. Log Replication and Consistency Check
When the Leader receives a client command:
1. It appends the command to its local log as a new uncommitted entry with the current term.
2. It issues AppendEntries RPCs containing the entry, along with the index and term of the immediately preceding log entry (prevLogIndex, prevLogTerm).
3. Follower Consistency Check: Followers reject the RPC if their local log lacks an entry matching prevLogIndex and prevLogTerm. This inductive rule guarantees that whenever an AppendEntries succeeds, the Follower's log matches the Leader's log up to the new entry.
4. Once an entry has been replicated on a majority of nodes, the Leader commits it and applies it to its local State Machine.

## 4. Safety Invariants
- Election Safety: At most one leader can be elected in a given term.
- Leader Append-Only: A leader never overwrites or truncates its own log entries; it only appends new entries.
- Log Matching Property: If two logs contain an entry with the same index and term, then the logs are identical in all entries up through the given index.
- Leader Completeness: If a log entry is committed in a given term, that entry will be present in the logs of the leaders for all higher-numbered terms.
- State Machine Safety: If a server has applied an entry at a given index to its state machine, no other server will ever apply a different entry for the same index.`
  });
  await doc1.save();

  const quiz1 = new Quiz({
    docId: doc1._id,
    generatedByModel: 'OmniRoute / Claude 3.7 Sonnet',
    questions: [
      {
        question: 'Why does Raft mandate randomized election timeouts rather than deterministic fixed timers?',
        options: [
          'To prevent persistent split votes by ensuring one candidate times out and captures quorum first.',
          'To minimize network socket serialization overhead across wide-area networks.',
          'To allow follower nodes to calculate Byzantine fault thresholds dynamically.',
          'To force log compaction passes during idle CPU windows.'
        ],
        correctIndex: 0,
        explanation: 'Randomized election timeouts (150ms-300ms) ensure nodes trigger elections at staggered intervals, dramatically reducing split vote collisions.'
      },
      {
        question: 'What is the purpose of the prevLogIndex and prevLogTerm checks in AppendEntries RPCs?',
        options: [
          'To maintain the Log Matching Invariant by ensuring follower logs match the leader before accepting new entries.',
          'To measure network round-trip ping time and adjust dynamic timeout windows.',
          'To authenticate client TLS certificates before processing writes.',
          'To trigger immediate cluster-wide leader step-down.'
        ],
        correctIndex: 0,
        explanation: 'The Log Matching Property relies on inductive verification: matching prevLogIndex and prevLogTerm ensures historical continuity.'
      },
      {
        question: 'What guarantees that a committed entry is never overwritten by a future leader?',
        options: [
          'The Leader Completeness property, which ensures voters only elect candidates whose logs contain all committed entries.',
          'The Follower heartbeat throttle mechanism.',
          'Periodic write-ahead log encryption on disk.',
          'A two-phase commit lock on all candidate nodes.'
        ],
        correctIndex: 0,
        explanation: 'A candidate must prove its log is at least as up-to-date as the majority quorum to win election, guaranteeing Leader Completeness.'
      },
      {
        question: 'How does a follower react when receiving an AppendEntries RPC from an outdated leader with a lower term number?',
        options: [
          'It rejects the RPC and returns its current higher term number to force the outdated leader to step down.',
          'It updates its local term counter to match the stale leader.',
          'It buffers the uncommitted entries in an in-memory queue.',
          'It immediately drops all existing committed state machine entries.'
        ],
        correctIndex: 0,
        explanation: 'Servers in Raft immediately reject requests from older terms and include their current higher term in the reply so the stale leader transitions back to Follower.'
      },
      {
        question: 'Under what condition does a Raft leader safely mark a log entry as committed?',
        options: [
          'When the entry from the current term has been successfully replicated across a majority quorum of nodes.',
          'Immediately upon appending the entry to its own local disk.',
          'When every single node in the entire cluster acknowledges the write.',
          'After the subsequent term election timeout completes.'
        ],
        correctIndex: 0,
        explanation: 'Leader commitment requires majority quorum replication (N/2 + 1 nodes) for entries originated in the current term.'
      },
      {
        question: 'What happens when a Candidate discovers an active Leader with a term greater than or equal to its own during an election?',
        options: [
          'It recognizes the leader as legitimate and steps down to the Follower state.',
          'It increments its term counter again and issues a forced re-election.',
          'It terminates its network socket connection.',
          'It broadcasts a split-vote cancellation token.'
        ],
        correctIndex: 0,
        explanation: 'If a candidate receives an AppendEntries from a valid leader with an equal or higher term, it yields and reverts to Follower.'
      }
    ]
  });
  await quiz1.save();

  // 2. Transformer Architecture & Multi-Head Self-Attention
  const doc2 = new Document({
    ownerId: null,
    title: 'Neural_Attention_Mechanics.pdf',
    sourceType: 'pdf',
    pageCount: 8,
    isDemoDoc: true,
    rawText: `# Attention Is All You Need: Architectural Specification of the Transformer

## Abstract
The Transformer model discards recurrent connections and convolutional layers entirely, relying solely on multi-head self-attention mechanisms to capture global dependencies between input tokens regardless of distance.

## 1. Scaled Dot-Product Attention
The fundamental computational unit of the Transformer is Scaled Dot-Product Attention. Given Queries (Q), Keys (K), and Values (V) of dimension d_k:
Attention(Q, K, V) = softmax( (Q * K^T) / sqrt(d_k) ) * V

### Scaling Factor Rationale
For large values of d_k, the dot products grow large in magnitude, pushing the softmax function into regions with extremely small gradients (vanishing gradient problem). Dividing by sqrt(d_k) scales the variance back to 1.0, ensuring stable backward propagation gradients.

## 2. Multi-Head Attention
Instead of performing a single attention function with d_model-dimensional queries, keys, and values, Multi-Head Attention projects Q, K, and V linearly h times with distinct learned linear projections to dimensions d_k, d_k, and d_v.
MultiHead(Q, K, V) = Concat(head_1, ..., head_h) * W^O
where head_i = Attention(Q * W_i^Q, K * W_i^K, V * W_i^V)

Multi-head attention allows the model to jointly attend to information from different representation subspaces at different positions simultaneously.

## 3. Positional Encodings
Because the model contains no recurrence or convolutions, it possesses no innate sense of sequence ordering. Fixed sinusoidal positional encodings are added to the input embeddings:
PE(pos, 2i)   = sin(pos / 10000^(2i / d_model))
PE(pos, 2i+1) = cos(pos / 10000^(2i / d_model))

This allows the model to easily learn relative positions since PE(pos + k) can be represented as a linear function of PE(pos).

## 4. Feed-Forward Networks and Residual Normalization
Each layer consists of two sub-layers: a multi-head self-attention mechanism and a position-wise fully connected feed-forward network (FFN). A residual connection is employed around each sub-layer, followed by Layer Normalization:
Output = LayerNorm(x + Sublayer(x))

The FFN consists of two linear transformations with a ReLU or GELU activation:
FFN(x) = max(0, x * W_1 + b_1) * W_2 + b_2`
  });
  await doc2.save();

  const quiz2 = new Quiz({
    docId: doc2._id,
    generatedByModel: 'OmniRoute / Claude 3.7 Sonnet',
    questions: [
      {
        question: 'Why does Scaled Dot-Product Attention divide the query-key dot product by sqrt(d_k)?',
        options: [
          'To prevent the dot products from growing excessively large and pushing the softmax into vanishing gradient regions.',
          'To ensure sequence representations fit into GPU tensor cache lines.',
          'To normalize the sequence length dimension across varying batch sizes.',
          'To convert float32 weights into int8 quantized integers.'
        ],
        correctIndex: 0,
        explanation: 'When d_k is large, dot products increase in magnitude, leading to saturated softmax outputs with negligible gradients; scaling by sqrt(d_k) stabilizes training.'
      },
      {
        question: 'What is the primary computational advantage of Multi-Head Attention over single-head attention?',
        options: [
          'It allows the model to jointly attend to information from distinct representation subspaces at multiple positions in parallel.',
          'It reduces the overall parameter count of the projection matrices to zero.',
          'It removes the need for residual connections and layer normalization.',
          'It forces quadratic attention complexity down to strict O(1) constant time.'
        ],
        correctIndex: 0,
        explanation: 'Multi-Head Attention enables parallel projection across distinct learned subspaces, capturing syntactic and semantic relationships simultaneously.'
      },
      {
        question: 'Why are Positional Encodings required in the standard Transformer architecture?',
        options: [
          'Because self-attention is permutation-invariant and lacks inherent awareness of token sequence order.',
          'To prevent recurrent feedback loops between decoder layers.',
          'To compress vocabulary embeddings into smaller dense vectors.',
          'To enforce causal masking during bidirectional encoder training.'
        ],
        correctIndex: 0,
        explanation: 'Without recurrence or convolution, self-attention processes all tokens as an unordered set; positional encodings inject token position information.'
      },
      {
        question: 'What mathematical property makes sinusoidal positional encodings advantageous for variable sequence lengths?',
        options: [
          'The encoding for pos + k can be expressed as a linear transformation of the encoding at pos.',
          'They strictly truncate all sequences to fixed powers of two.',
          'They produce discrete integer tokens compatible with hash tables.',
          'They eliminate the need for cross-entropy loss.'
        ],
        correctIndex: 0,
        explanation: 'Trigonometric identities allow the model to generalize to arbitrary relative offsets pos + k via a simple rotation matrix.'
      },
      {
        question: 'What is the role of Layer Normalization within each Transformer sub-layer block?',
        options: [
          'Normalizes activations across the channel dimension for each individual sample, stabilizing intermediate hidden states.',
          'Averages gradients across all GPUs in a distributed cluster.',
          'Zeros out negative weights to enforce sparsity.',
          'Transforms float values into one-hot binary vectors.'
        ],
        correctIndex: 0,
        explanation: 'LayerNorm normalizes features across the hidden dimensions independently per token, mitigating internal covariate shift.'
      }
    ]
  });
  await quiz2.save();

  // 3. Abstract Syntax Tree (AST) Optimization Passes
  const doc3 = new Document({
    ownerId: null,
    title: 'Compilers_AST_Optimization.docx',
    sourceType: 'docx',
    pageCount: 5,
    isDemoDoc: true,
    rawText: `# Compiler Frontend Optimization: Abstract Syntax Trees & Static Single Assignment

## Abstract
Modern optimizing compiler frontends translate raw source code into an Abstract Syntax Tree (AST) before lowering it to an Intermediate Representation (IR). This pipeline executes machine-independent optimizations including Constant Folding, Dead Code Elimination, Common Subexpression Elimination, and Loop Invariant Code Motion.

## 1. Abstract Syntax Trees vs Parse Trees
A Concrete Syntax Tree (Parse Tree) records the full syntactic grammar of the program, including parentheses, semicolons, and commas. An Abstract Syntax Tree (AST) discards superfluous syntactic tokens, retaining only semantic operator nodes and operands arranged hierarchically.

## 2. Static Single Assignment (SSA) Form
Lowering an AST into Static Single Assignment (SSA) form mandates a strict formal invariant:
- Single Assignment: Every variable is defined exactly once in the entire IR program.
- Phi Functions: At control-flow merge points (e.g. following an if-else branch or loop header), phi-functions select the correct version of a variable based on the preceding basic block path:
  x_3 = phi(x_1, x_2)
SSA vastly simplifies data-flow analysis by transforming use-def chains into explicit graph edges.

## 3. Core Optimization Passes
### Constant Folding & Propagation
Evaluates arithmetic expressions whose operands are known compile-time constants (e.g. 3 + 5 * 2 -> 13) and replaces all subsequent uses of that variable with the folded constant literal.

### Dead Code Elimination (DCE)
Traverses the control-flow graph (CFG) and dependency graph to identify statements that compute values never observed in any observable program exit or side-effect. Unreachable basic blocks and unreferenced assignments are pruned.

### Common Subexpression Elimination (CSE)
Detects identical expressions computed multiple times along identical execution paths. Replaces subsequent computations with the stored result of the first evaluation.

### Loop Invariant Code Motion (LICM)
Hoists computations whose operands do not change across loop iterations out of the loop header to reduce runtime CPU cycles.`
  });
  await doc3.save();

  const quiz3 = new Quiz({
    docId: doc3._id,
    generatedByModel: 'OmniRoute / Claude 3.7 Sonnet',
    questions: [
      {
        question: 'What is the primary defining invariant of Static Single Assignment (SSA) form in compiler intermediate representations?',
        options: [
          'Every variable is assigned a value exactly once, with phi-functions resolving values at control-flow join points.',
          'All loops are unrolled into flat sequential assembly instructions.',
          'All floating-point arithmetic is converted to fixed-point integer math.',
          'Functions are restricted to taking a single argument.'
        ],
        correctIndex: 0,
        explanation: 'In SSA form, every variable definition is unique, eliminating ambiguity in use-def chains and simplifying global data-flow analysis.'
      },
      {
        question: 'How does Constant Folding differ from Constant Propagation?',
        options: [
          'Constant folding evaluates compile-time expressions into literals; constant propagation substitutes those known values into subsequent statements.',
          'Constant folding is performed by the linker, while constant propagation happens in the hardware pipeline.',
          'Constant folding only applies to strings, while constant propagation applies to integers.',
          'There is no difference; they are synonymous compiler passes.'
        ],
        correctIndex: 0,
        explanation: 'Constant folding computes constant expressions (e.g. 2 + 2 -> 4), whereas constant propagation replaces variable instances with their known constant values.'
      },
      {
        question: 'What is the purpose of a Phi (phi) node in an SSA-form control-flow graph?',
        options: [
          'Selects the appropriate variable version dynamically based on which preceding basic block was executed before the merge point.',
          'Allocates physical CPU registers for loop index counters.',
          'Throws a runtime exception if an uninitialized pointer is dereferenced.',
          'Compresses intermediate representation bytecode before JIT compilation.'
        ],
        correctIndex: 0,
        explanation: 'Phi functions resolve multiple reaching definitions at control-flow join points (e.g., after if-else branches).'
      },
      {
        question: 'Which optimization pass identifies and moves loop-independent computations outside of the loop body?',
        options: [
          'Loop Invariant Code Motion (LICM)',
          'Static Single Assignment (SSA)',
          'Common Subexpression Elimination (CSE)',
          'Dead Code Elimination (DCE)'
        ],
        correctIndex: 0,
        explanation: 'Loop Invariant Code Motion (LICM) detects expressions within a loop whose values remain constant across iterations and hoists them before the loop.'
      },
      {
        question: 'What distinguishes an Abstract Syntax Tree (AST) from a Concrete Syntax Tree (Parse Tree)?',
        options: [
          'An AST strips away non-semantic punctuation and syntactic sugar, preserving purely operational hierarchies.',
          'An AST contains machine-specific assembly opcodes.',
          'A Parse Tree only contains type annotations.',
          'An AST cannot represent control flow structures.'
        ],
        correctIndex: 0,
        explanation: 'ASTs omit structural syntactic details (such as semicolons and grouping parentheses), retaining pure semantic operator and operand relationships.'
      }
    ]
  });
  await quiz3.save();

  console.log('[Seed] Database seeded successfully with 3 demo documents and quizzes.');
  console.log(`- Doc 1: ${doc1.title} (${doc1._id}) - Quiz questions: ${quiz1.questions.length}`);
  console.log(`- Doc 2: ${doc2.title} (${doc2._id}) - Quiz questions: ${quiz2.questions.length}`);
  console.log(`- Doc 3: ${doc3.title} (${doc3._id}) - Quiz questions: ${quiz3.questions.length}`);
}

if (process.argv[1]?.includes('seed.js')) {
  seed().then(() => {
    process.exit(0);
  }).catch((err) => {
    console.error('[Seed Error]', err);
    process.exit(1);
  });
}
