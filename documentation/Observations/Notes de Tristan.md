# Observations du spécimen B3L-41R

## Blacklist (fonctions à ne pas utiliser)
- SQL:BeginTransaction 

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
 Le menu indique que <b>F7</b> sert à <i>Step into</i> et <b>F8</b> sert à <i>Step over</i>. Cependant, les deux touches ont le comportement <i>Step into</i>. Buggé sur 4.2H et 4.2I.

 À ce qu'il parait, Belair (la compagnie?) ont déjà ouvert un ticket sur le sujet

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

 ### DayOf(date) et MonthOf(date)
 Bien que la documentation mentionne que le paramètre d'entrée de ces fonctions est une date, il semble qu'on peut entrer un string comme paramètre. Quand on donne un string, le BSE à dla misère et confond parfois le jour et le mois de la date, donc DayOf() renvoie le mois et MonthOf() renvoie le jour.

 ```
   uses SysLib

   local date, dateStr, dateJson
   dateJson := "2024-01-12T00:00:00"
   date := dateFromIso(dateJson)
   dateStr := FormatDateTime("dd/mm/yyyy",date)

   print(dateJson)
   print(dateStr)
   print("Mois str : " + toStr(MonthOf(dateStr)))
   print("Jour str : " + toStr(DayOf(dateStr)))
   print(date)
   print("Mois : " + toStr(MonthOf(date)))
   print("Jour : " + toStr(DayOf(date)))
 ```

 La raison pourquoi Belair ne renvoie pas d'erreur lorsqu'on passe un string est inconnue.

 ### Piec_New (et toutes les fonctions qui l'appellent)
 Dans la fonction, la ligne suivante ne fonctionne pas parce que le nom de la propriété est Sitpiece et non Sitpiec (on est dans une libraire de Belair pour info).
 ```
 Piec.Sitpiec := Obj:GetPropDef(PiecCodes,"Sit_EnEtablissement","2")
 ```

 Vu que cette ligne ne marche pas, la nouvelle pièce a toujours la situation de la dernière pièce (vu qu'elle en est une copie). Dans le cas de FullCont_CreateNewPiece, la fonction ferme la pièce précédente et en ouvre une nouvelle donc la nouvelle pièce est créée avec une situation de "Fin de pièce". smh 
 Un autre truc bizarre d'ailleurs est que la situation de départ pour une nouvelle pièce est "2" mais, dans notre bd, "2" signifie Erreur...

 ### Risk_CopyItems (et toutes les fonctions qui l'appellent)
 Un des paramètres d'entrée (Target) de cette fonction est mal utilisé. Target est supposé être un objet de type Piece mais il est passé en paramètre à Risk_Copy() en paramètre (2ème) qui devrait être un id d'adhésion. Appeler cette fonction donnera donc toujours une erreur de typage (si utilisée telle que convenue).
 Piec_CopyAdhsFromPrevious() appelle Risk_CopyItems(), elle est donc aussi inutilisable.

 ### Sql:BeginTransaction() (quand utilisé avec Automate())
 Vu qu'une transaction SQL vérouille la donnée modifiée/créée pour le script BSE, le fait d'appeller l'Automate pour faire du traitement sur cette même donnée renvoie une erreur. Le truc le plus bizarre c'est que sur staging/prod ça marche...

 ## Comportements étranges

 ### CRLF
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

 ### Les "champs calculés" de Belair
 Du gros troll... sur l'écran de contrat, y'a une section échéance avec les périodes d'échéances. En pesant F8 avec un des champs séléctionné, on peut voir de quel colonne/table il vient. Sur la modélisation de la bd, ça dit que c'est une colonne dans le SQL (absolument faux) et une propriété. Je n'ai pas regardé tous les champs calculés mais sur contrat, ces propriétés n'existent même pas (bruh). Genre utiliser contrat.debsuiv, etc ne fait rien sur le BSE. Pour les PBs, tu ne peux pas prendre une ligne, la modifier et la sauvegarder sans mettre ptann et ptann1 à null parce que ces champs calculés sont pris de la BD et quand tu save, Belair n'accepte pas des champs qui ne sont pas des (vraies) colonnes de PB. Les champs calculés font aussi geler les requêtes sur Belair (Bureautique => Requêtes), donc tu peux pas afficher la prochaine échéance sur ta liste de renouvellements. 

 ### Bug lors du déboguage 4.2I 

 Rouler ce script avec un breakpoint et un watch sur la variable policy

 ```
   local policy

   policy := from poli where contrat = 269755 and piece = 1 and role = "P"
   policy := policy[0]
   //policy := Obj:GetByKey("POLI", 269755, 1, cie)

   print(Dumpvar(policy))

   return 
 ```

 On a report le bug à Dimitri/Belair, ils ont créé un ticket.

 ## Features ABSOLUMENT INUTILES

 ### Le Call Stack

 On a demandé à Dimitri que signifiait les nombres sur le call stack afin de mieux le comprendre.

 "Pour les messages d'erreur la call stack ne vous importe peu elle est surtout pour nous en interne pour savoir si nous avons une corruption d'une adresse mémoire." - Dimitri / 5 décembre 2024

 Voilà, ce n'est même pas un feature développée pour nous, les devs, c'est pour ça que ça veut rien dire.

