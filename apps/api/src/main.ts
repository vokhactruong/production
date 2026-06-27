import { NestFactory } from "@nestjs/core";
import { ValidationPipe, Logger } from "@nestjs/common";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { NestExpressApplication } from "@nestjs/platform-express";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import { AppModule } from "./app.module";
import { AllExceptionsFilter } from "./common/filters/http-exception.filter";
import { TransformInterceptor } from "./common/interceptors/transform.interceptor";
import { LoggingInterceptor } from "./common/interceptors/logging.interceptor";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.use(helmet());
  app.use(cookieParser());

  const allowedOrigins = [
    "http://localhost:3000",
    "http://localhost:5173",
    process.env.FRONTEND_URL,
    process.env.WEB_URL,
  ].filter((o): o is string => Boolean(o));

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    })
  );

  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new LoggingInterceptor(), new TransformInterceptor());

  const config = new DocumentBuilder()
    .setTitle("School Portal API")
    .setVersion("1.0")
    .addBearerAuth()
    .addTag("Auth")
    .addTag("Users")
    .addTag("Roles")
    .addTag("Permissions")
    .addTag("Categories")
    .addTag("Articles")
    .addTag("Upload")
    .addTag("Audit Logs")
    .build();
  SwaggerModule.setup("api/docs", app, SwaggerModule.createDocument(app, config));

  const port = process.env.PORT ?? 3001;
  await app.listen(port);
  Logger.log(`API running on http://localhost:${port}`);
  Logger.log(`Swagger: http://localhost:${port}/api/docs`);
}

bootstrap();
