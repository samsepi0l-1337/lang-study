import { createHash } from "node:crypto";

export const emptyPreviousHash = "0".repeat(64);

export type Proposal = {
  language: string;
  title: string;
  text: string;
};

export type Block = {
  index: number;
  timestamp: string;
  proposal: Proposal;
  previousHash: string;
  hash: string;
};

type BlockBody = {
  index: number;
  timestamp: string;
  proposal: Proposal;
  previousHash: string;
};

function canonical(body: BlockBody): string {
  const proposal = body.proposal;
  return JSON.stringify({
    index: body.index,
    timestamp: body.timestamp,
    proposal: {
      language: proposal.language,
      title: proposal.title,
      text: proposal.text,
    },
    previousHash: body.previousHash,
  });
}

export function hashBlock(body: BlockBody): string {
  return createHash("sha256").update(canonical(body)).digest("hex");
}

function bodyOf(block: Block): BlockBody {
  return {
    index: block.index,
    timestamp: block.timestamp,
    proposal: block.proposal,
    previousHash: block.previousHash,
  };
}

// 작업 증명은 의도적으로 생략합니다. 해시로 블록을 잇는 목록만 다룹니다.
export class Chain {
  blocks: Block[] = [];

  append(proposal: Proposal, timestamp: string): Block {
    const previous = this.blocks[this.blocks.length - 1];
    const body: BlockBody = {
      index: this.blocks.length,
      timestamp,
      proposal,
      previousHash: previous === undefined ? emptyPreviousHash : previous.hash,
    };
    const block: Block = { ...body, hash: hashBlock(body) };
    this.blocks.push(block);
    return block;
  }

  validate(): boolean {
    for (let index = 0; index < this.blocks.length; index += 1) {
      const block = this.blocks[index];
      if (block.index !== index) {
        return false;
      }
      if (hashBlock(bodyOf(block)) !== block.hash) {
        return false;
      }
      const expectedPrevious =
        index === 0 ? emptyPreviousHash : this.blocks[index - 1].hash;
      if (block.previousHash !== expectedPrevious) {
        return false;
      }
    }
    return true;
  }
}
