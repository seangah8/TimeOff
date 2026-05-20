import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

// Two roles exist in the system. The role is set at registration and never changes.
export enum UserRole {
  Requester = 'Requester',
  Validator = 'Validator',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  // Names are unique across the whole system — this is the only identifier used for login.
  @Column({ type: 'varchar', length: 50, unique: true })
  name!: string;

  @Column({ type: 'enum', enum: UserRole })
  role!: UserRole;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;
}
