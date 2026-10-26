import { Module, OnModuleInit } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { join } from 'path';
import * as fs from 'node:fs';
import fastifyStatic from '@fastify/static';
import { EnvironmentService } from '../environment/environment.service';
import { WorkspaceRepo } from '@docmost/db/repos/workspace/workspace.repo';

@Module({})
export class StaticModule implements OnModuleInit {
  constructor(
    private readonly httpAdapterHost: HttpAdapterHost,
    private readonly environmentService: EnvironmentService,
    private readonly workspaceRepo: WorkspaceRepo,
  ) {}

  public async onModuleInit() {
    const httpAdapter = this.httpAdapterHost.httpAdapter;
    const app = httpAdapter.getInstance();

    const clientDistPath = join(
      __dirname,
      '..',
      '..',
      '..',
      '..',
      'client/dist',
    );

    const indexFilePath = join(clientDistPath, 'index.html');

    if (fs.existsSync(clientDistPath) && fs.existsSync(indexFilePath)) {
      const indexTemplateFilePath = join(clientDistPath, 'index-template.html');
      const windowVar = '<!--window-config-->';

      const configString = {
        ENV: this.environmentService.getNodeEnv(),
        APP_URL: this.environmentService.getAppUrl(),
        CLOUD: this.environmentService.isCloud(),
        FILE_UPLOAD_SIZE_LIMIT:
          this.environmentService.getFileUploadSizeLimit(),
        FILE_IMPORT_SIZE_LIMIT:
          this.environmentService.getFileImportSizeLimit(),
        DRAWIO_URL: this.environmentService.getDrawioUrl(),
        SUBDOMAIN_HOST: this.environmentService.isCloud()
          ? this.environmentService.getSubdomainHost()
          : undefined,
        COLLAB_URL: this.environmentService.getCollabUrl(),
        BILLING_TRIAL_DAYS: this.environmentService.isCloud()
          ? this.environmentService.getBillingTrialDays()
          : undefined,
        BETA_PUBLIC_SPACES: this.environmentService.isBetaPublicSpaces(),
        POSTHOG_HOST: this.environmentService.getPostHogHost(),
        POSTHOG_KEY: this.environmentService.getPostHogKey(),
        AI_VECTOR_DRIVER:
          this.environmentService.getAiVectorDriver() === 'turbopuffer'
            ? 'turbopuffer'
            : undefined,
      };

      const windowScriptContent = `<script>window.CONFIG=${JSON.stringify(configString)};</script>`;

      if (!fs.existsSync(indexTemplateFilePath)) {
        fs.copyFileSync(indexFilePath, indexTemplateFilePath);
      }

      const html = fs.readFileSync(indexTemplateFilePath, 'utf8');
      const transformedHtml = html.replace(windowVar, windowScriptContent);

      fs.writeFileSync(indexFilePath, transformedHtml);

      const RENDER_PATH = '*';

      await app.register(fastifyStatic, {
        root: clientDistPath,
        wildcard: false,
        index: false,
        setHeaders: (reply: any, pathName: string) => {
          // Vite content-hashes everything under /assets, so they can be cached forever
          if (/[\\/]assets[\\/]/.test(pathName)) {
            reply.header(
              'Cache-Control',
              'public, max-age=31536000, immutable',
            );
          }
        },
      });

      app.get(RENDER_PATH, async (req: any, res: any) => {
        // a missing hashed asset belongs to another build, so don't answer it with the app shell
        if (req.url.startsWith('/assets/')) {
          return res.code(404).header('Cache-Control', 'no-store').send();
        }

        let html = fs.readFileSync(indexFilePath, 'utf8');

        const workspace = await this.resolveWorkspace(req);

        if (workspace) {
          const settings = (workspace.settings ?? {}) as Record<string, any>;
          const faviconFile = settings?.branding?.favicon;

          if (faviconFile) {
            const faviconUrl = `/api/attachments/img/workspace-favicon/${faviconFile}`;
            html = html.replace(
              /(<link[^>]*rel="icon"[^>]*href=")[^"]*/gi,
              `$1${faviconUrl}`,
            );
          }
        }

        res.header('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.type('text/html').send(html);
      });
    }
  }

  private async resolveWorkspace(req: any) {
    if (req.raw?.workspace) {
      return req.raw.workspace;
    }

    if (this.environmentService.isSelfHosted()) {
      return await this.workspaceRepo.findFirst();
    }

    const header = req.raw.headers.host;
    if (header) {
      const subdomain = header.split('.')[0];
      return await this.workspaceRepo.findByHostname(subdomain);
    }

    return null;
  }
}
