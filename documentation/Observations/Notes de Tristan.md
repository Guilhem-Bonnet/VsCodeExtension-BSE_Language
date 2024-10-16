# Observations du spécimen B3L-41R
## Nom de fonctions
Étonnement, on peut nommer des méthodes avec un <b>:</b> telles que "Json:AddObject()".

Cépendant, cela ne marche que pour les noms déjà utilisé de cette façon. Il est donc impossible de nommer une méthode "string:IsNullOrEmpty()" (où du moins l'appeler ne marche pas).

Les noms disponibles sont :
 - Meta:
 - XML:
 - File:
 - Obj:
 - JSON:
 - HTTP:
 - HTML:
 - Zip:
 - RegEx:

 Mettre un <b>.</b> ne marche pas du tout.

 ## Déboguage
 On peut utiliser <b>F7</b> et <b>F8</b> pour avancer ligne par ligne durant le déboguage. 
 Le menu indique que <b>F7</b> sert à <i>Step into</i> et <b>F8</b> sert à <i>Step over</i>. Cependant, les deux touches ont le comportement <i>Step into</i>. On ignore si ce bug est seulement sur la version 4.2H.

 ## Expressions booléennes
 Belair permet de retourner une expression booléenne depuis une fonction et le retour sera typé correctement.

 Cet example est donc possible :
 ```
 return ((isNull(inputString)) or (trim(inputString) = ""))
 ```

 On peut également mettre une variable booléenne dans un <i>if then</i> statement sans avoir à faire ça :

 ```
  if (myBoolVar = false) then
 ```
 Donc l'expression est valable :
 ```
  if (myBoolVar) then
 ```

 En bref, pour le booléen, le BSE comme les autres languages. Youpi!

 ## Comportement des objets

 Le principe de pointeur marche sur Belair!
 Utiliser des objets imbriqués c'est moche... dans mon exemple, j'ai essayé de print Obj1.Animal.Chameau et j'ai eu une erreur de conversion. Belair est pas capable de savoir le type de Chameau je crois même si dans le dumpVar, il le connaît. 

 ```
    local Obj1, Obj2, debug

    Obj1 := Obj:New()
    Obj2 := Obj:New()
    Obj2.Chameau := "MEUH!!"
    Obj1.Animal := Obj2

    Obj2.Compagnon := Obj1

    print(dumpVar(Obj1.Animal))
    print("------")

    debug := Obj1.Animal
    Obj2.Chameau := "BEEEEEEH"

    print(dumpVar(Obj2))
    print(dumpVar(debug))
    print(debug.Chameau)
 ```

  ## Fonctions qui ne sont PAS dans la doc (genre du tout)
 - FileToStrBase64(string path) //returns string


 ## Comportements de fonctions indésirables
 ### FileExtractName(string)
 La fonction marche si le path contient des \ (backlash) et ne marche pas avec des / (slash).

 ### GetHolidaysList(int), GetHolidayNames(int), DayIsHoliday(date) et possiblement GetNextWorkingDay(date, int)
 Les jours fériés de Belair sont ceux de la France donc pratiquement inutiles dans notre cas...

 ### DayOf(date) et MonthOf(date) (À valider / Source douteuse)
 À partir du 13ème jour du mois (date locale du PC) les fonctions marchent.
 Sinon elles ne marchent pas (wtf).
 
 Edit : j'ai testé (4 et 15 Oct) et ça semble marcher. Peut-être que ça marche parce que mon poste à les dates en MM-JJ-YYYY (américain).

 ```
    local debug1, debug2
    debug1 := Now()
    debug2 := EncodeDate(2020, 12, 22)

    print(toStr(debug1))
    print(DayOf(debug1))
    print(MonthOf(debug1))
    print("-------")
    print(toStr(debug2))
    print(DayOf(debug2))
    print(MonthOf(debug2))
 ```

 ## Comportements étranges
 Le CRLF() peut être appelé sans les parenthèses (sauf sous certaines conditions). Voir le script suivant, il est vraiment intéressant

 ```
   local debug1
   debug1 := "Guilhem adore " + CRLF + " Belair"
   print(debug1)
   print("--------")

   local CRLF
   debug1 := "Guilhem adore " + CRLF + " Belair"
   print(debug1)
   print("--------")

   CRLF := "vraiment"
   debug1 := "Guilhem adore " + CRLF + " Belair"
   print(debug1)
   print("--------")

   debug1 := "Guilhem adore " + CRLF() + " Belair"
   print(debug1)
   print("--------")
 ```

