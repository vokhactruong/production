import {
  IsString,
  IsOptional,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  Min,
  Max,
  MaxLength,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";

const PAYMENT_METHODS = ["CASH", "BANK_TRANSFER"] as const;
const BILLING_CYCLE_STATUSES = ["PENDING", "ACTIVE", "COMPLETED", "CANCELLED"] as const;

/** Sell a package → creates a PENDING BillingCycle + a CHARGE ledger row. */
export class SellPackageDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  enrollmentId!: string;

  /** The cap this cycle grants. Defaults to remaining package lessons (pro-rata
   * basis, OQ-A). */
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  sessionsSold?: number;

  /** Authorized manual price override (Q5). Requires `billing.override` — when
   * absent, the pro-rata price is used. */
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  priceOverride?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  discount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string;
}

/** Record a payment against a cycle. Overpayment becomes credit inline (no
 * second screen — the <1-minute flow). */
export class RecordPaymentDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  billingCycleId!: string;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  amount!: number;

  @ApiProperty({ enum: PAYMENT_METHODS })
  @IsEnum(PAYMENT_METHODS)
  method!: "CASH" | "BANK_TRANSFER";

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string;
}

export class BillingCycleQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  enrollmentId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  studentId?: string;

  @ApiPropertyOptional({ enum: BILLING_CYCLE_STATUSES })
  @IsOptional()
  @IsEnum(BILLING_CYCLE_STATUSES)
  status?: "PENDING" | "ACTIVE" | "COMPLETED" | "CANCELLED";

  @ApiPropertyOptional({ enum: ["asc", "desc"], default: "desc" })
  @IsOptional()
  @IsEnum(["asc", "desc"])
  sortOrder?: "asc" | "desc" = "desc";

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 10;
}

export class PaymentQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  studentId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  billingCycleId?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 10;
}

/** Withdraw from a cycle → unused paid value becomes student credit (D16). */
export class WithdrawCreditDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  billingCycleId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string;
}

/** Apply available student credit against a cycle's outstanding (offset, D16). */
export class OffsetCreditDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  billingCycleId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string;
}

export class RefundCreditDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string;
}

export class CreditQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  studentId?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 10;
}
