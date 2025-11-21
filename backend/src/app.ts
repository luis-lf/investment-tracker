import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';

// Import routes
import authRoutes from './routes/auth';
import investmentRoutes from './routes/investments';
import snapshotRoutes from './routes/snapshots';
import exchangeRateRoutes from './routes/exchangeRates';
import dashboardRoutes from './routes/dashboard';
import taxRoutes from './routes/tax';
import importExportRoutes from './routes/importExport';

// Import middleware
import { errorHandler } from './middleware/errorHandler';
import { notFound } from './middleware/notFound';
import { logger } from './utils/logger';

dotenv.config();

class App {
  public app: Application;
  private apiPrefix: string;

  constructor() {
    this.app = express();
    this.apiPrefix = process.env.API_PREFIX || '/api/v1';
    
    this.initializeMiddleware();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  private initializeMiddleware(): void {
    // Security middleware
    this.app.use(helmet());
    
    // CORS configuration
    const corsOptions = {
      origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
      credentials: true,
      optionsSuccessStatus: 200
    };
    this.app.use(cors(corsOptions));
    
    // Compression middleware
    this.app.use(compression());
    
    // Body parsing middleware
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));
    
    // Rate limiting
    const limiter = rateLimit({
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
      max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100')
    });
    this.app.use(`${this.apiPrefix}/`, limiter);
    
    // Static files (for future file uploads)
    this.app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
    
    // Request logging
    this.app.use((req: Request, _res: Response, next: NextFunction) => {
      logger.info(`${req.method} ${req.path}`, {
        ip: req.ip,
        userAgent: req.get('user-agent')
      });
      next();
    });
  }

  private initializeRoutes(): void {
    // Health check endpoint
    this.app.get('/health', (_req: Request, res: Response) => {
      res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
      });
    });

    // API Documentation
    this.app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
      customSiteTitle: 'Investment Tracker API',
      customCss: '.swagger-ui .topbar { display: none }',
      swaggerOptions: {
        persistAuthorization: true,
        displayRequestDuration: true,
        filter: true,
        tryItOutEnabled: true
      }
    }));

    // Swagger JSON endpoint
    this.app.get('/api-docs.json', (_req: Request, res: Response) => {
      res.setHeader('Content-Type', 'application/json');
      res.send(swaggerSpec);
    });

    // API routes
    // Auth routes (no authentication required)
    this.app.use(`${this.apiPrefix}/auth`, authRoutes);

    // Protected routes (authentication required)
    this.app.use(`${this.apiPrefix}/investments`, investmentRoutes);
    this.app.use(`${this.apiPrefix}/snapshots`, snapshotRoutes);
    this.app.use(`${this.apiPrefix}/exchange-rates`, exchangeRateRoutes);
    this.app.use(`${this.apiPrefix}/dashboard`, dashboardRoutes);
    this.app.use(`${this.apiPrefix}/tax`, taxRoutes);
    this.app.use(`${this.apiPrefix}/import-export`, importExportRoutes);
  }

  private initializeErrorHandling(): void {
    // 404 handler
    this.app.use(notFound);
    
    // Global error handler
    this.app.use(errorHandler);
  }

  public listen(): void {
    const port = process.env.PORT || 3001;

    this.app.listen(port, () => {
      logger.info(`Server is running on port ${port}`);
      logger.info(`API available at http://localhost:${port}${this.apiPrefix}`);
      logger.info(`API Documentation available at http://localhost:${port}/api-docs`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  }
}

export default App;
