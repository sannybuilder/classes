import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { Game, GameClasses, Classes } from '../../models';
import { GitHubService } from '../github/service';

@Injectable({ providedIn: 'root' })
export class ClassesService {
  constructor(private _github: GitHubService) {}

  loadClasses(game: Game, accessToken?: string): Observable<Classes> {
    return this._github.loadFileGracefully(
      GameClasses[game],
      accessToken,
      game
    );
  }
}
