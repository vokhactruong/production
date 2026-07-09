import { Controller, Get, Post, Body, Param, Query, ParseIntPipe, UseGuards } from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { AuthGuard } from "../auth/guards/auth.guard";
import { RequirePermissions } from "../auth/decorators/permissions.decorator";
import { CurrentUser, RequestUser } from "../auth/decorators/current-user.decorator";
import { BillingService } from "./billing.service";
import { PaymentRecordingService } from "./payment-recording.service";
import {
  SellPackageDto,
  RecordPaymentDto,
  BillingCycleQueryDto,
  PaymentQueryDto,
} from "./dto/payment.dto";

@ApiTags("Payments")
@ApiBearerAuth()
@Controller()
@UseGuards(AuthGuard)
export class PaymentsController {
  constructor(
    private readonly billing: BillingService,
    private readonly payments: PaymentRecordingService
  ) {}

  // ----- Billing cycles -----

  @Post("billing-cycles")
  @RequirePermissions("billing.create")
  @ApiOperation({ summary: "Bán gói (tạo chu kỳ thanh toán + ghi nợ)" })
  sell(@Body() dto: SellPackageDto, @CurrentUser() user: RequestUser) {
    return this.billing.sell(dto, user.id);
  }

  @Get("billing-cycles")
  @RequirePermissions("billing.read")
  @ApiOperation({ summary: "Danh sách chu kỳ thanh toán" })
  findCycles(@Query() query: BillingCycleQueryDto) {
    return this.billing.findAll(query);
  }

  @Get("billing-cycles/:id")
  @RequirePermissions("billing.read")
  @ApiOperation({ summary: "Chi tiết chu kỳ thanh toán" })
  findCycle(@Param("id") id: string) {
    return this.billing.findOne(id);
  }

  // ----- Payments & receipts -----

  @Post("payments")
  @RequirePermissions("payment.create")
  @ApiOperation({ summary: "Ghi nhận thanh toán (tiền thừa → credit trong cùng luồng)" })
  record(@Body() dto: RecordPaymentDto, @CurrentUser() user: RequestUser) {
    return this.payments.recordPayment(dto, user.id);
  }

  @Get("payments")
  @RequirePermissions("payment.read")
  @ApiOperation({ summary: "Danh sách thanh toán" })
  findPayments(@Query() query: PaymentQueryDto) {
    return this.payments.findPayments(query);
  }

  @Get("payments/receipt/:receiptNumber")
  @RequirePermissions("receipt.read")
  @ApiOperation({ summary: "Xem lại biên lai theo số biên lai" })
  findReceipt(@Param("receiptNumber", ParseIntPipe) receiptNumber: number) {
    return this.payments.findReceipt(receiptNumber);
  }
}
