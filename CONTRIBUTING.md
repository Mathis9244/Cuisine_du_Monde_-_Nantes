# Guide de Contribution

Merci de votre intérêt pour contribuer à Cuisine du Monde ! 🎉

## Comment contribuer

### Signaler un bug

Si vous trouvez un bug :

1. Vérifiez que le bug n'a pas déjà été signalé dans les [Issues](https://github.com/VOTRE_USERNAME/cuisine_du_monde/issues)
2. Créez une nouvelle issue avec :
   - Une description claire du bug
   - Les étapes pour reproduire le bug
   - Le comportement attendu vs le comportement actuel
   - Votre environnement (OS, version Python, etc.)

### Proposer une amélioration

1. Créez une issue pour discuter de votre proposition
2. Attendez le feedback de la communauté
3. Si approuvé, créez une Pull Request

### Ajouter une nouvelle source de scraping

1. Créez une nouvelle méthode dans `WebRestaurantScraper` :
   ```python
   def scrape_nouvelle_source(self, location: str, **kwargs) -> List[Dict]:
       """
       Scrape des restaurants depuis [Nom de la source].
       
       ATTENTION: Vérifiez les conditions d'utilisation avant d'utiliser.
       """
       # Votre code ici
   ```

2. Ajoutez des tests si possible
3. Documentez la méthode
4. Ajoutez la source dans `scrape_all_sources()` si approprié
5. Mettez à jour le README.md

### Standards de code

- Suivez le style PEP 8 pour Python
- Ajoutez des docstrings pour toutes les fonctions
- Utilisez des noms de variables explicites
- Commentez le code complexe

### Processus de Pull Request

1. Fork le projet
2. Créez une branche (`git checkout -b feature/AmazingFeature`)
3. Committez vos changements (`git commit -m 'Add some AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrez une Pull Request

### Questions ?

N'hésitez pas à ouvrir une issue pour poser des questions !
