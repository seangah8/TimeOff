import 'reflect-metadata';
import 'dotenv/config';
import { AppDataSource } from '../config/database';
import { User, UserRole } from '../entities/User';
import { VacationRequest, VacationStatus } from '../entities/VacationRequest';

const VALIDATOR_NAMES = [
  'Morgan', 'Jordan', 'Taylor', 'Casey', 'Riley',
  'Quinn', 'Avery', 'Blake', 'Cameron', 'Drew',
];

const REJECTION_COMMENTS = [
  'Overlaps with a critical project deadline.',
  'Insufficient team coverage during this period.',
  'Too many requests submitted for the same dates.',
  'Please resubmit with more advance notice.',
  'Conflicts with a mandatory company event.',
];

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function addDays(dateStr: string, days: number): string {
  const date = new Date(dateStr);
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
}

function randomDateInNextMonths(months: number): string {
  const start = new Date();
  const end = new Date();
  end.setMonth(end.getMonth() + months);
  const diff = end.getTime() - start.getTime();
  return new Date(start.getTime() + Math.random() * diff).toISOString().split('T')[0];
}

function hasOverlap(
  approved: { startDate: string; endDate: string }[],
  startDate: string,
  endDate: string,
): boolean {
  return approved.some((r) => r.startDate <= endDate && r.endDate >= startDate);
}

async function seed() {
  await AppDataSource.initialize();
  console.log('Database connected');

  const userRepo = AppDataSource.getRepository(User);
  const vrRepo = AppDataSource.getRepository(VacationRequest);

  await AppDataSource.query('TRUNCATE TABLE vacation_requests, users RESTART IDENTITY CASCADE');
  console.log('Cleared existing data');

  const validators = await userRepo.save(
    VALIDATOR_NAMES.map((name) => userRepo.create({ name, role: UserRole.Validator })),
  );
  console.log(`Created ${validators.length} validators`);

  let totalRequests = 0;

  for (let i = 1; i <= 100; i++) {
    const requester = await userRepo.save(
      userRepo.create({ name: `Sean Gah ${i}`, role: UserRole.Requester }),
    );

    const requestCount = randomInt(0, 4);
    const approvedRanges: { startDate: string; endDate: string }[] = [];

    for (let j = 0; j < requestCount; j++) {
      const startDate = randomDateInNextMonths(6);
      const endDate = addDays(startDate, randomInt(2, 19));
      const statuses = [VacationStatus.Pending, VacationStatus.Approved, VacationStatus.Rejected];
      const status = statuses[randomInt(0, 2)];

      if (status === VacationStatus.Approved) {
        if (hasOverlap(approvedRanges, startDate, endDate)) continue;
        approvedRanges.push({ startDate, endDate });
      }

      await vrRepo.save(
        vrRepo.create({
          requester,
          startDate,
          endDate,
          reason: Math.random() > 0.5 ? 'Personal time off' : null,
          status,
          comment: status === VacationStatus.Rejected
            ? REJECTION_COMMENTS[randomInt(0, REJECTION_COMMENTS.length - 1)]
            : null,
          validator: status !== VacationStatus.Pending
            ? validators[randomInt(0, validators.length - 1)]
            : null,
        }),
      );
      totalRequests++;
    }
  }

  console.log(`Created 100 requesters and ${totalRequests} vacation requests`);
  await AppDataSource.destroy();
  console.log('Seed complete');
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
