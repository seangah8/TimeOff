import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './User';

export enum VacationStatus {
  Pending = 'Pending',
  Approved = 'Approved',
  Rejected = 'Rejected',
}

@Entity('vacation_requests')
export class VacationRequest {
  @PrimaryGeneratedColumn()
  id!: number;

  // The employee who submitted this request. The column name matches the spec's user_id.
  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'user_id' })
  requester!: User;

  // The validator who acted on the request. Null until approved or rejected.
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'validator_id' })
  validator!: User | null;

  // Stored as PostgreSQL date (YYYY-MM-DD), no time component.
  @Column({ type: 'date' })
  startDate!: string;

  @Column({ type: 'date' })
  endDate!: string;

  // Optional — requesters may leave this blank.
  @Column({ type: 'text', nullable: true })
  reason!: string | null;

  @Column({ type: 'enum', enum: VacationStatus, default: VacationStatus.Pending })
  status!: VacationStatus;

  // Rejection note written by the validator. Required on rejection, null otherwise.
  // Named "comment" (singular) rather than the spec's "comments" because it is a
  // single note, not a collection of messages.
  @Column({ type: 'text', nullable: true })
  comment!: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
