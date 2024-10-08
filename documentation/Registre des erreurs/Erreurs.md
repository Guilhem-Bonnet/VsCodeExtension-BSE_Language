# Erreurs

## [Error] : Subroutine myFunction already declared
 Si vous êtes certain qu'il n'y a pas deux fonctions avec ce même nom, c'est probablement un problème avec vos imports. Vérifiez le <i>uses</i> de vos scripts, il faut que les imports pour une librairies utilisent la même casse (de caractère).

#### Exemple :
Le Script Ferme a les imports suivants :
```
 uses AnimauxDeFermeLib, AnimauxDomestiquesLib
```

La librairie AnimauxDeFermeLib a les imports suivants :
```
 uses VacheLib, PouletLib, MoutonLib, CHienLib 
```

La librairie AnimauxDomestiquesLib a les imports suivants :
```
 uses ChienLib, ChatLib, HamsterLib 
```

Vu que le nom pour la librairie ChienLib n'est pas écrite <b>exactement de la même façon</b> dans les imports des deux librairies (vu que l'une des deux a un H majuscule). Belair comprends CHienLib et ChienLib comme étant deux librairies différentes donc il la charge deux fois et les fonctions de ChienLib renvoient une erreur telle que : Subroutine ChasserLesEcureuils already declared.

## [Error] : Invalid IF/SI statement
 - Il manque un statement <i>then</i> après ta condition

# Erreurs Runtime
## [Error] : Could not convert variant of type into type