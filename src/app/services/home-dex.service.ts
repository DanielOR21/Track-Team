import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class HomeDexService {

  constructor(private httpClient: HttpClient) { }

  pokemon_API_URL: string = "https://pokeapi.co/api/v2/pokemon";
  move_API_URL: string = "https://pokeapi.co/api/v2/move";
  ability_API_URL: string = "https://pokeapi.co/api/v2/ability";

  getPokemonListApi(offset:number, limit:number): Observable<any> {
    let fullAPI_URL = this.pokemon_API_URL+"?offset="+offset+"&limit="+limit;
    console.log(fullAPI_URL)
    return this.httpClient.get(fullAPI_URL).pipe(res=>res);
  }

  getPokemonApi(id:number): Observable<any> {
    let fullAPI_URL = this.pokemon_API_URL+"/"+id;
    console.log(fullAPI_URL)
    return this.httpClient.get(fullAPI_URL).pipe(res=>res);
  }

  getMoveListApi(offset:number, limit:number): Observable<any> {
    let fullAPI_URL = this.move_API_URL+"?offset="+offset+"&limit="+limit;
    console.log(fullAPI_URL)
    return this.httpClient.get(fullAPI_URL).pipe(res=>res);
  }
  
  getMoveApi(id:number): Observable<any> {
    let fullAPI_URL = this.move_API_URL+"/"+id;
    console.log(fullAPI_URL)
    return this.httpClient.get(fullAPI_URL).pipe(res=>res);
  }

  getAbilityListApi(offset:number, limit:number): Observable<any> {
    let fullAPI_URL = this.ability_API_URL+"?offset="+offset+"&limit="+limit;
    console.log(fullAPI_URL)
    return this.httpClient.get(fullAPI_URL).pipe(res=>res);
  }
  
  getAbilityApi(id:number): Observable<any> {
    let fullAPI_URL = this.ability_API_URL+"/"+id;
    console.log(fullAPI_URL)
    return this.httpClient.get(fullAPI_URL).pipe(res=>res);
  }


}
