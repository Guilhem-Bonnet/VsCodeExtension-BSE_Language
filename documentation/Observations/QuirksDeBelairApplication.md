## Ajout de pièce
Belair se comporte de façon bizarre lorsqu'on ajoute une nouvelle pièce.

Voici un exemple : J'ai un contrat avec une pièce (en cours). 
J'ajoute un avenant ce qui ferme la première pièce. 
Tant que je ne ferme pas la fenêtre de Belair, l'avenant n'est pas disponible dans le SQL alors que la première pièce est bien modifiée dans le SQL.
Donc rouler le SQL (SELECT B_CONTRAT, B_PIECE FROM PIECEAMC WHERE B_CONTRAT = 270143 AND B_SITPIECE = '1') ne renvoie rien.
