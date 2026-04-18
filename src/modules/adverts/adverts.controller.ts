import { Request, Response } from 'express';
import { AdvertsService } from './adverts.service.js';
import http from 'node:http';
import https from 'node:https';

export class AdvertsController {
    constructor(private readonly service: AdvertsService) { }

    private pipeFromUrl = async (url: string, res: Response, depth = 0): Promise<void> => {
        if (depth > 3) {
            res.status(502).json({ ok: false, error: 'Too many upstream redirects' });
            return;
        }

        let parsed: URL;
        try {
            parsed = new URL(url);
        } catch {
            res.status(400).json({ ok: false, error: 'Invalid media URL' });
            return;
        }

        const isHttps = parsed.protocol === 'https:';
        const client = isHttps ? https : http;

        await new Promise<void>((resolve) => {
            const req = client.request(
                {
                    protocol: parsed.protocol,
                    hostname: parsed.hostname,
                    port: parsed.port ? Number(parsed.port) : undefined,
                    path: `${parsed.pathname}${parsed.search}`,
                    method: 'GET',
                    headers: {
                        Accept: 'image/*,*/*;q=0.8',
                        'User-Agent': 'MBI-Store/1.0',
                    },
                },
                (upstream) => {
                    const status = upstream.statusCode ?? 502;

                    if (status >= 300 && status < 400 && upstream.headers.location) {
                        const location = String(upstream.headers.location);
                        upstream.resume();
                        const next = location.startsWith('http') ? location : new URL(location, parsed).toString();
                        void this.pipeFromUrl(next, res, depth + 1).finally(resolve);
                        return;
                    }

                    if (status >= 400) {
                        upstream.resume();
                        res.status(502).json({ ok: false, error: `Failed to fetch media (${status})` });
                        resolve();
                        return;
                    }

                    const rawCt = upstream.headers['content-type'];
                    const contentType = Array.isArray(rawCt) ? rawCt[0] : (rawCt || 'application/octet-stream');
                    res.setHeader('Content-Type', String(contentType));
                    res.setHeader('Cache-Control', 'public, max-age=3600');
                    upstream.pipe(res);
                    upstream.on('end', () => resolve());
                },
            );

            req.setTimeout(15000, () => {
                req.destroy(new Error('Upstream timeout'));
            });

            req.on('error', (err) => {
                if (!res.headersSent) {
                    res.status(502).json({ ok: false, error: err?.message || 'Failed to fetch media' });
                }
                resolve();
            });

            req.end();
        });
    };

    listPublic = async (_req: Request, res: Response) => {
        try {
            const adverts = await this.service.listPublic();
            res.json({ ok: true, adverts });
        } catch (err: any) {
            res.status(500).json({ ok: false, error: err?.message || 'Failed to load adverts' });
        }
    };

    listAdmin = async (_req: Request, res: Response) => {
        try {
            const adverts = await this.service.listAdmin();
            res.json({ ok: true, adverts });
        } catch (err: any) {
            res.status(500).json({ ok: false, error: err?.message || 'Failed to load adverts' });
        }
    };

    create = async (req: Request, res: Response) => {
        try {
            const advert = await this.service.create(req.body);
            res.status(201).json({ ok: true, advert });
        } catch (err: any) {
            res.status(400).json({ ok: false, error: err?.message || 'Failed to create advert' });
        }
    };

    update = async (req: Request, res: Response) => {
        try {
            const advert = await this.service.update(req.params.id, req.body);
            res.json({ ok: true, advert });
        } catch (err: any) {
            res.status(400).json({ ok: false, error: err?.message || 'Failed to update advert' });
        }
    };

    delete = async (req: Request, res: Response) => {
        try {
            await this.service.delete(req.params.id);
            res.json({ ok: true });
        } catch (err: any) {
            res.status(400).json({ ok: false, error: err?.message || 'Failed to delete advert' });
        }
    };

    media = async (req: Request, res: Response) => {
        try {
            const id = String(req.params.id || '').trim();
            if (!id) return res.status(400).json({ ok: false, error: 'Missing advert id' });

            const advert = await this.service.getById(id);
            if (!advert) return res.status(404).json({ ok: false, error: 'Advert not found' });
            if (advert.mediaType !== 'IMAGE' || !advert.imageUrl) {
                return res.status(404).json({ ok: false, error: 'Advert has no image' });
            }

            await this.pipeFromUrl(advert.imageUrl, res);
            return;
        } catch (err: any) {
            return res.status(500).json({ ok: false, error: err?.message || 'Failed to load media' });
        }
    };
}
