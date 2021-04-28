import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Location } from '@angular/common';
import { Inject, Injectable } from '@angular/core';
import { catchError, map, switchMap } from 'rxjs/operators';

import { CONFIG, Config } from '../../config';
import { Game } from '../../models';

import type { components } from '@octokit/openapi-types';

export type GetRepoContentResponseDataBlob = components['schemas']['blob'];
export type GetRepoContentResponseDataDirectory = components['schemas']['content-directory'];

@Injectable({ providedIn: 'root' })
export class GitHubService {
  constructor(
    @Inject(CONFIG) private _config: Config,
    private _http: HttpClient
  ) {}

  loadFileGracefully(fileName: string, accessToken: string, game: Game) {
    const ts = Date.now().toString();
    return this._http
      .get(Location.joinWithSlash(this._config.endpoints.base, fileName))
      .pipe(
        catchError(() => {
          const headers = accessToken
            ? new HttpHeaders({
                'Content-Type': 'application/json',
                Authorization: `Bearer ${accessToken}`,
              })
            : undefined;
          return this._http
            .get<GetRepoContentResponseDataDirectory>(
              Location.joinWithSlash(this._config.endpoints.contents, game),
              {
                headers,
              }
            )
            .pipe(
              switchMap((dir) => {
                const { git_url } =
                  dir.find((file) => file.path === fileName) ?? {};
                if (!git_url) {
                  throw new Error(`File ${fileName} not found in the repo`);
                }
                return this._http
                  .get<GetRepoContentResponseDataBlob>(git_url, {
                    headers,
                  })
                  .pipe(map((blob) => JSON.parse(atob(blob.content))));
              }),
              catchError(() =>
                this._http.get(Location.joinWithSlash('/assets', fileName), {
                  params: { ts },
                })
              )
            );
        })
      );
  }
}