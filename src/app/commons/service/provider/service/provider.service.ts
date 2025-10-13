import { Injectable } from '@angular/core';
import { environment } from '../../../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { catchError, Observable, retry, timeout } from 'rxjs';
import { HttpHelperService } from '../../http-helper/service/http-helper.service';
import { BranchRequest } from '../interface/branch-request';
import { Branch } from '../interface/provider';


@Injectable({
  providedIn: 'root'
})
export class ProviderService {

  private readonly baseUrl = environment.provider_api_url;

  constructor(
    private readonly http: HttpClient,
    private readonly httpHelper: HttpHelperService
  ) {
    this.httpHelper = httpHelper;
    this.http = http;
  }

  getBranchesByIds(branches: BranchRequest[]): Observable<Branch[]> {
    const keys: string[] = branches.map(branch =>
      `${branch.company_id} | ${branch.branch_id}`
    );
    const params = { 'keys': keys.join(',') };
    const options = this.httpHelper.getCompleteHttpOptions(params);
    return this.http.get<Branch[]>(`${this.baseUrl}/branches`, options)
    .pipe(
      retry(2),
      timeout(5000),
      //catchError(this.httpHelper.handleError)
    );
  }
}