# VsCodeBSE
# BSE :

# Belair4

# Dosiers des Scripts
- Les Scripts sont dans **APPAMC/**
- BSE scripts sont dans **APPAMC/BASScripts/Custom**
- Automate Scripts sont dans **APPAMC/Automate**


# BSE
###  Pour utilisé une librairie avec BSE :
Créer la librairie dans **APPAMC/BASScripts/Custom/libs**
- l'extension est **.bs**

La librairie est alors accessible depuis les scripts dans **APPAMC/BASScripts/Custom/**

# Technical Documentation Overview

This document provides a structured overview of various script and database manipulation techniques, with specific conventions and examples.

## Script Execution and Testing

- **ExecScript**: Not to be used in production (`PAS EN PROD`).
- **RunAction**: Standard operation call.
- **Unit Tests**: Perform unit testing as indicated (`faire test unit`).

## Data Models and Operations

- **Model Hierarchy**: Tier => Contract => Claim => Contribution/Receipt?
- **Executable Model**: Utilize `BaiData.exe` for model operations.

## Variable Declarations and Types

- **Local Variables**:
  - Syntax: `local$ s`, `localX myBool`
  - Declaration should always initialize the variable to prevent memory retention issues.

- **Global Variables**:
  - Used within automation only (e.g., `IA$`, `IAX`).
  - Variables starting with `I` (input variables) retain the last assigned value and must always be initialized upon declaration.

- **Variable Types**:
  - `$` denotes a string.
  - No specific notation for integer (implied by absence).
  - `X` denotes a boolean.
  - `D` denotes a date.

## Assignment and Usage

- **Assignment**: `:=`
- **Return**: `=`
- **Local Variable Usage**: Prefix with `localX` for boolean, e.g., `localX test`.

## SQL Interaction

- **SQL Commands**:
```sql
SQL:new(test)
SELECT TOP(100) B_NUMTIERS, B_RSOCIALE FROM [TIERS]
SQL:open(test)
```

- **Loop and Control Structures**
```sql
:StartLoop
IF RESULT = 0; >EndLoop
PRINT(?SQLtest("B_NUMTIERS") + " " + ?SQLtest("B_RSOCIALE"))
SQL:Next(test)
>StartLoop
:EndLoop
```

- SQL Parameterization: Use `:IA` for safe parameter inclusion.

## HTTP Calls and External Scripts
- **Basic External Script Execution:**
```
BasRunAction("NOM_DU_SCRIPT", "param1;param2;param3")
```
- Handling External Parameters:
    - Retrieve parameters using `GetExtParam("param1")`.
    - All calls to the BSE are synchronous.

## BSE (Base Script Environment)

- **Script Structure:**
    - Use `uses` for includes, similar to import statements in other languages.
    - Declare functions after the return statement to keep them separate from the main script body.
- **Variable Declaration:**
- Multiple variables can be declared on the same line, possibly without explicit types (`local s, doc, http`).
- Object properties can be dynamically added (`o.PropertyQuiExistePas := 3`).

## Object Manipulation
- **Object Operations:**
```
Http:new("utf-8")
s := obj:GetByKey("NOM_DE_TABLE", idVar)
Obj:Save(s)  // Acts as an update
Obj:Delete(s)  // Deletes a record without confirmation
```

- **SQL Transactions:**
```
SQL:BeginTransaction()
Sql:CommitTransaction()
Sql:RollbackTransaction()
```
- **Caution:**
    - Fetch new IDs `(SQL:NewId("MY_TABLE_NAME"))` outside transactions to avoid issues.

## Development Tools

- **BSEDev.exe:** For scripting in BSE.
- **BaiModel.exe:** For viewing "tables".

## Notes Tristan : 
ExecScript => PAS EN PROD
faire test unit
RunAction
Tier => Contrat => Sinistre => Cotisation/Quittence?
Model Écran => BaiData.exe
 
FEUILLES DE CALCUL
y'a un dictionnaire pour les méthodes
 
IA => declar variable (le I veut dire input et le A est le nom de la var)
$ string
rien integer
X booleen
D date
 
local ex: local$ s, localX myBool
GLOBAL
I (juste l'utiliser dans l'automate) ex: IA$, IAX
c'est touchy les Iqqchose pcq ça garde en mémoire la dernière value assignée dans un script
EN GROS, TJRS ASSIGNER LES VARIABLES I LORS DE LA DÉCLARATION
 
:= assignation
 
= return
 
pour utiliser les variables :
IBX => IB
localX test => test
 
pour assigner les locals
!test := test
 
 
utiliser {"NOM_DE_CALCUL"}
pour appeller un calcul
 
 
SI macondition; instructionif; instructionelse
 
>ok (> utilisé pour goto)
:ok (: utilisé comme anchor)
 
SQL:new(test)
*SELECT TOP(100) B_NUMTIERS, B_RSOCIALE FROM [TIERS] 
SQL:open(test)
 
:StartLoop
 
SI RESULT = 0; >EndLoop
PRINT(?SQLtest("B_NUMTIERS") + " " + ?SQLtest("B_RSOCIALE"))
SQL:Next(test)
>StartLoop
 
:EndLoop
 
SQL:close(test)
SQL:free(test)
 
pour les params sql (contre injection) => utiliser le :IA (donc il faut utiliser les var avec I)
RESULT est un bool qui dit si la query sql a trouvé des lignes
 
Ex: Rectiers(1000) va positioner le programme sur la 1000ème ligne de la table tier
après je peux utiliser le ?Tiers("NOM_DE_COLONNE") pour lire la donnée
 
on peut mettre des breakpoints dans les scripts automate
Executer => Déboguage
pour voir les valeurs des variables fait click-gauche ensuite click-droit sur une variable
 
ex pour un if/else avec plusieurs instructions
 
SI IB = VRAI; >ok; >ko
:ok
//ligne de code
//ligne de code
//ligne de code
>apresko
:ko
//ligne de code
//ligne de code
:apresko
 
POUR CALL HTTP IL FAUT APPELER LE BSE
BasRunAction("NOM_DU_SCRIPT", "param1;param2;param3") //les params doivent être déclarée local
Pour prendre les var sur le BSE tu utilise GetExtParam("param1")
Tous les calls au BSE sont synchrones
 
 
 
BSE
uses //comme includes
 
du haut au return c'est comme le "main"
si tu veux faire des functions, le faire après le return
 
Les extparams c'est comme les params d'entrée de fonction
ClearExtParams avant de faire des tests
GetExtParamDef("NOM_VAR", "DEF_VALUE");
 
contrairement à automate, on peut déclarer plusieurs var sur la même ligne => local s, doc, http
on dirais aussi que le type est optionnel comme si tous était any
 
vu que c'est orienté obj, on peut utiliser s.PropertyName
tu peux ajouter des properties avec o.PropertyQuiExistePas := 3 et elle va se créer
 
Http:new("utf-8")
s := obj:GetByKey("NOM_DE_TABLE", idVar)
if(not ISSNULL(s)) then ...
 
Obj:Save(s) => C'est comme update
Obj:Delete(s) => ça trash ta ligne NO ARE YOU SURE?
Pour insert il faut get une un nouv id de la table, l'assigner et ensuite Save()
s.numtiers := SQL:NewId("MY_TABLE_NAME")
 
Obj:SelectSQL(...) pas recommandé pcq injection sql
 
if (not myBoolVar) then
begin
	//code
	//code
end
 
Y'A UN MAX DE 2MIN POUR UN HTTP/SCRIPT BSE
TOUJOURS UTILISER UNE TRANSACTION POUR LE SQL
SQL:BeginTransaction()
Sql:CommitTransaction()
Sql:RollbackTransaction()
WARNING : FETCH LES NEWID() HORS DES TRANSACTIONS SINON SHIT HAPPENS
il faut rajouter tout les options dans la barre de recherche (c une table)
 
Donc 3 façons pour SQL dans BSE
Obj:GetByKey()
SQL:New()...
LINQ (ex:   myVar := from TIERS JOIN Cont ON ... WHERE TIERS.NUMTIERS = 3) //PEUT PAS METTRE D'ALIAS
 
BSEDev.exe => faire des scripts BSE
BaiModel.exe => voir les "tables"