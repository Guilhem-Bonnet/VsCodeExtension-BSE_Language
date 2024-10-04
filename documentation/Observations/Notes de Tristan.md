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

  ## Fonctions qui ne sont PAS dans la doc (genre du tout)
 - FileToStrBase64(string path) //returns string


 ## Comportement de fonctions indésirables
 ### FileExtractName(string)
 La fonction marche si le path contient des \ (backlash) et ne marche pas avec des / (slash).