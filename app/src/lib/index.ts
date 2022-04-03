import * as anchor from '@project-serum/anchor';
import type { PDA } from './pda';
import type { DonatePlatfrom, DonatesAcc, DonatorAcc, MakeDonation, Success } from './types';

export class Donates implements DonatePlatfrom {
  donates: any;
  donator: any;
  pda: PDA;
  program: anchor.Program<anchor.Idl>;
  authority: anchor.web3.PublicKey;
  systemProgram: anchor.web3.PublicKey;
  donatePlatform: anchor.web3.PublicKey;

  constructor(data: DonatePlatfrom) {
  }

  async getData(): Promise<DonatesAcc | undefined> {
    let { donates, donatePlatform } = this;
    try {
      return await donates.fetch(donatePlatform);
    } catch (e) {
      console.log('Error during getting Donates account data:', e);
    }
  }

  async getDonator(id: number): Promise<DonatorAcc | undefined> {
    let { pda, donatePlatform, donator } = this;
    try {
      let donatorAcc = await pda.donatorAcc(donatePlatform, id);
      return await donator.fetch(donatorAcc);
    } catch (e) {
      console.log(`Error during getting Donator(id=${id}) account data:`, e);
    }
  }

  async getDonators(): Promise<DonatorAcc[]> {
    let { idCounter } = await this.getData();
    let donators = [];
    for (const i of Array(idCounter).keys()) {
      donators.push(this.getDonator(i));
    }
    donators = await Promise.all(donators);
    donators.sort(
      (a: DonatorAcc, b: DonatorAcc) => a.amount - b.amount,
    );
    return donators;
  }

  async send(donation: MakeDonation): Promise<Success> {
    let { address, amount, id } = donation;
    if (amount <= 0 || id < 0) return false;
    let { program, donatePlatform, pda } = this;
    let donatorAcc = await pda.donatorAcc(donatePlatform, id);

    try {
      await program.methods
        .send(new anchor.BN(id), new anchor.BN(amount))
        .accounts({
          donator: address,
          donatorAcc,
          donatePlatform,
        });

      return true;
    } catch (e) {
      console.log('Error during sending:', e);
    }
    return false;
  }

  async withdraw(): Promise<Success> {
    let { program, donatePlatform, authority } = this;
    try {
      await program.methods
        .withdraw()
        .accounts({ donatePlatform, authority })
        .rpc();
      return true;
    } catch (e) {
      console.log('Withdraw error:', e);
    }
    return false;
  }

  async initialize(target: number): Promise<Success> {
    if (target <= 0) return false;

    try {
      let { authority, pda, systemProgram, program, donatePlatform } = this;
      await program.methods
        .initialize(new anchor.BN(target))
        .accounts({
          donatePlatform,
          authority,
          systemProgram,
        })
        .rpc();
      return true;
    } catch (err) {
      console.log('Initialization error:', err);
    }
    return false;
  }
}
