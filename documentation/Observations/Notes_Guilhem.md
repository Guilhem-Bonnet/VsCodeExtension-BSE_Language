# Observations du spécimen B3L-41R
## Correction de la documentation

### La commande BSEExec.exe
D'après la documentation cette commande permet de faire de la ligne de commande pour exécuter les scripts .bs

Après essais sur la version 4.2IH de Belair:
Aucun test n'as été concluant.
Le message d'erreur : 
 - ``L'execution a echoue avec l'erreur : 250477278``
Aucune documentation disponible à ce propos

**Alternative**

Utiliser **BasClientCmd.exe** avec un fichier **XML**
exemple de commande :
```
C:\Belair4\BasClientCmd.exe /iC:\Belair4\APPAMC\BASScripts\Custom\Batch\Renew_ACI.xml
```
La structure se présente comme suit :
``Path BasClientCmd.exe`` ``/instruction`` ``Path xml``

exemple xml:

```xml
<?xml version="1.0" encoding="utf-8"?>
<params>
  <param name="ProcessName" type="ptString">Renouvellement ACI</param>
  <param name="ActionName" type="ptString">Batch_Renewals_ACI</param>
  <param name="Login" type="ptString">BSE</param>
  <param name="PasswordEncrypt" type="ptString">86jM0cl0gaC8T/gs7N1wBz9umiBCTbOMbOJ1fqm3Sz34+ugvfN1LEcjxN26+dNt3yRvD7UrdsdG02sF2CN2JWcLd7Sv8/9JEkpw1WDcUP5Nwa96Y0e4N2C/agYNoJR70R88jBBl4yLDDMpLRxhaAAeC6iZrug5qwOr3QIpJp3ZXODM3jYZMU3VLm0DJHJF2iAPnQPhuy1IOV11IYWD8fAjs3aSqrZ/xAS7GPkkL5+qJCs9R2pPAD4EP+CRYlL9Heb40jPv69sWqAl74wvjNc6/WF</param>
  <param name="Conf" type="ptString">C:\Belair4\APPAMC\APPAMC.CONF</param>
  <param name="ClassName" type="ptString">TRunActionProcessing</param>
</params>
```


**ActionName** :
- Nom du script **.bs**
- Son path par défaut ici est le folder ***Custom***
