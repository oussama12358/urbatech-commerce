// World cities database grouped by country code
const CITIES = {
  AF: [
    "Kabul", "Herat", "Kandahar", "Mazar-i-Sharif", "Jalalabad", "Kunduz", "Ghazni", "Balkh", "Baghlan", "Gardez",
    "Khost", "Farah", "Puli Khumri", "Samangan", "Sar-e Pol", "Taloqan", "Maimana", "Sheberghan", "Zaranj", "Lashkargah",
    "Charikar", "Aybak", "Feyzabad", "Parun", "Nili", "Qalat", "Ma'adan", "Mehtar Lam", "Asadabad", "Mahmud Raqi",
    "Qal-e-Naw", "Chaghcharan", "Sharan", "Nawzad", "Marjah", "Sangin", "Gereshk", "Spin Boldak", "Khost", "Urgun"
  ],
  AL: [
    "Tirana", "Durrës", "Vlorë", "Elbasan", "Shkodër", "Fier", "Korçë", "Berat", "Lushnjë", "Lezhë",
    "Kavajë", "Pogradec", "Laç", "Gjirokastër", "Patos", "Krujë", "Kuçovë", "Sarandë", "Burrel", "Rrëshen",
    "Mamurras", "Bajram Curri", "Peshkopi", "Librazhd", "Çorovodë", "Ersekë", "Pukë", "Kukës", "Tepelenë", "Mirditë",
    "Shijak", "Sukth", "Fushë-Krujë", "Ballsh", "Maliq", "Prrenjas", "Gramsh", "Orikum", "Polican", "Çorovodë"
  ],
  DZ: [
    "Algiers", "Oran", "Constantine", "Annaba", "Blida", "Sétif", "Djelfa", "Béjaïa", "Batna", "Tizi Ouzou",
    "Biskra", "Tébessa", "Mostaganem", "Tiaret", "Sidi Bel Abbès", "Médéa", "Aïn Oulmene", "Mascara", "Béchar", "Tlemcen",
    "Souk Ahras", "Guelma", "Bou Saâda", "Bordj Bou Arréridj", "Jijel", "Laghouat", "Aïn Sefra", "Relizane", "Chlef", "Bouïra",
    "Mila", "El Eulma", "Saïda", "Ouargla", "Aïn Beïda", "Ksar El Boukhari", "Boghni", "M'Sila", "El Oued", "Khenchela",
    "Azzaba", "Aflou", "Oum el Bouaghi", "Sig", "Mansourah", "Lakhdaria", "Aïn Touta", "Tolga", "Barika", "Bir el Ater",
    "Bordj Ghdir", "Bouhadjar", "Cheraga", "Draria", "El Harrach", "Hussein Dey", "Kouba", "Mohammadia", "Oued Smar", "Reghaïa",
    "Rouiba", "Staouéli", "Zeralda", "Beni Saf", "Bou Hanifia", "Es Senia", "Frenda", "Gdyel", "Hassi Messaoud", "Meftah"
  ],
  AD: ["Andorra la Vella", "Escaldes-Engordany", "Encamp", "Sant Julià de Lòria", "La Massana", "Ordino", "Canillo", "El Serrat", "Pas de la Casa", "Arinsal"],
  AO: [
    "Luanda", "Huambo", "Lobito", "Benguela", "Cuito", "Lubango", "Malanje", "Namibe", "Soyo", "Cabinda",
    "Uíge", "M'banza-Kongo", "Sumbe", "Ndalatando", "Caála", "Menongue", "Luena", "Lucapa", "Dundo", "Nzeto",
    "Porto Amboim", "Caxito", "Catumbela", "Gabela", "Cubal", "Chibia", "Camacupa", "Quibala", "Mocamedes", "Chongoroi",
    "Calandula", "Ambriz", "Andulo", "Bailundo", "Balombo", "Benguela", "Bibala", "Bocoio", "Caconda", "Cacuso"
  ],
  AR: [
    "Buenos Aires", "Córdoba", "Rosario", "Mendoza", "La Plata", "San Miguel de Tucumán", "Mar del Plata", "Salta", "Santa Fe", "San Juan",
    "Resistencia", "Santiago del Estero", "Corrientes", "Posadas", "San Salvador de Jujuy", "Bahía Blanca", "Paraná", "Neuquén", "Formosa", "San Luis",
    "La Rioja", "Río Cuarto", "Concordia", "Comodoro Rivadavia", "San Nicolás de los Arroyos", "San Rafael", "Villa María", "Villa Mercedes", "Goya", "Mercedes",
    "Azul", "Tandil", "Olavarría", "Pergamino", "Venado Tuerto", "Junín", "Río Gallegos", "Ushuaia", "Viedma", "Rawson",
    "Santa Rosa", "San Francisco", "Rafaela", "Villa Carlos Paz", "Río Grande", "Caleta Olivia", "General Roca", "Cipolletti", "Zárate", "Campana"
  ],
  AM: [
    "Yerevan", "Gyumri", "Vanadzor", "Vagharshapat", "Hrazdan", "Abovyan", "Kapan", "Armavir", "Gavar", "Artashat",
    "Ararat", "Dilijan", "Goris", "Ashtarak", "Sevan", "Masis", "Charentsavan", "Sisian", "Stepanavan", "Spitak",
    "Ijevan", "Yeghvard", "Metsamor", "Byureghavan", "Vardenis", "Akhtala", "Talin", "Maralik", "Noyemberyan", "Tashir",
    "Aparan", "Talin", "Vardenis", "Yeghegnadzor", "Meghri", "Sisian", "Goris", "Dilijan"
  ],
  AU: [
    "Sydney", "Melbourne", "Brisbane", "Perth", "Adelaide", "Gold Coast", "Canberra", "Newcastle", "Wollongong", "Hobart",
    "Geelong", "Townsville", "Cairns", "Darwin", "Toowoomba", "Ballarat", "Bendigo", "Mackay", "Launceston", "Rockhampton",
    "Bunbury", "Coffs Harbour", "Hervey Bay", "Shepparton", "Gladstone", "Mildura", "Warrnambool", "Port Macquarie", "Bathurst", "Tamworth",
    "Albury", "Mount Gambier", "Kalgoorlie", "Devonport", "Lismore", "Albany", "Geraldton", "Dubbo", "Orange", "Nowra",
    "Goulburn", "Armidale", "Griffith", "Broken Hill", "Whyalla", "Port Lincoln", "Port Pirie", "Victor Harbor", "Gawler", "Cessnock",
    "Taree", "Bowral", "Campbelltown", "Katoomba", "Parkes", "Swan Hill", "Echuca", "Sale", "Traralgon", "Wagga Wagga"
  ],
  AT: [
    "Vienna", "Graz", "Linz", "Salzburg", "Innsbruck", "Klagenfurt", "Villach", "Wels", "Sankt Pölten", "Dornbirn",
    "Steyr", "Bregenz", "Leoben", "Kapfenberg", "Hallein", "Kufstein", "Traun", "Amstetten", "Lustenau", "Baden",
    "Spittal an der Drau", "Telfs", "Lienz", "Knittelfeld", "Vöcklabruck", "Feldkirch", "Leonding", "Wattens", "Schwaz", "Bruck an der Mur",
    "Mödling", "Eisenstadt", "Neunkirchen", "Mistelbach", "Tulln", "Krems", "Stockerau", "Saalfelden", "Judenburg", "Zell am See"
  ],
  AZ: [
    "Baku", "Ganja", "Sumqayit", "Mingachevir", "Lankaran", "Shirvan", "Nakhchivan", "Shaki", "Yevlakh", "Khachmaz",
    "Agdam", "Salyan", "Barda", "Masalli", "Jalilabad", "Goychay", "Agjabadi", "Imishli", "Hajigabul", "Zaqatala",
    "Sabirabad", "Astara", "Gadabay", "Qazakh", "Tovuz", "Goranboy", "Gabala", "Shamakhi", "Ismayilli", "Balakan",
    "Agstafa", "Dashkasan", "Gobustan", "Kalbajar", "Kurdamir", "Lachin", "Lerik", "Neftchala", "Oguz", "Ordubad"
  ],
  BH: ["Manama", "Riffa", "Muharraq", "Hamad Town", "A'ali", "Isa Town", "Sitra", "Budaiya", "Jidhafs", "Sanabis", "Tubli", "Saar", "Durrat Al Bahrain", "Amwaj", "Diplomatic Area"],
  BD: [
    "Dhaka", "Chittagong", "Khulna", "Rajshahi", "Sylhet", "Barisal", "Rangpur", "Mymensingh", "Comilla", "Narayanganj",
    "Gazipur", "Jessore", "Saidapur", "Bogra", "Dinajpur", "Pabna", "Tangail", "Nawabganj", "Faridpur", "Kushtia",
    "Cox's Bazar", "Brahmanbaria", "Jamalpur", "Sirajganj", "Noakhali", "Madaripur", "Satkhira", "Habiganj", "Sunamganj", "Chandpur",
    "Narsingdi", "Sherpur", "Netrokona", "Kishoreganj", "Manikganj", "Munshiganj", "Gopalganj", "Shariatpur", "Meherpur", "Chuadanga",
    "Jhenaidah", "Magura", "Narail", "Bagerhat", "Pirojpur", "Jhalokati", "Barguna", "Patuakhali", "Lakshmipur", "Feni"
  ],
  BY: [
    "Minsk", "Gomel", "Mogilev", "Vitebsk", "Grodno", "Brest", "Babruysk", "Baranovichi", "Borisov", "Pinsk",
    "Orsha", "Mozyr", "Novopolotsk", "Lida", "Soligorsk", "Molodechno", "Polotsk", "Zhlobin", "Rechitsa", "Svetlogorsk",
    "Kobrin", "Slutsk", "Zhodino", "Vawkavysk", "Osipovichi", "Rogachev", "Bykhov", "Krichev", "Klimovichi", "Ivatsevichi",
    "Dzerzhinsk", "Luninets", "Slonim", "Masty", "Gorki", "Shklov", "Krugloye", "Berezino", "Cherikov", "Kostyukovichi"
  ],
  BE: [
    "Brussels", "Antwerp", "Ghent", "Charleroi", "Liège", "Bruges", "Namur", "Leuven", "Mons", "Mechelen",
    "Aalst", "Hasselt", "Kortrijk", "Ostend", "Tournai", "Genk", "Sint-Niklaas", "Roeselare", "Verviers", "Wavre",
    "Turnhout", "Louvain-la-Neuve", "Arlon", "Neufchâteau", "Marche-en-Famenne", "Bastogne", "Durbuy", "Dinant", "Huy", "Seraing",
    "Lokeren", "Deinze", "Waregem", "Tienen", "Braine-l'Alleud", "Waterloo", "Nivelles", "Rixensart", "Eupen", "Malmedy"
  ],
  BR: [
    "São Paulo", "Rio de Janeiro", "Brasília", "Salvador", "Fortaleza", "Belo Horizonte", "Manaus", "Curitiba", "Recife", "Porto Alegre",
    "Belém", "Goiânia", "Guarulhos", "Campinas", "São Luís", "Maceió", "Campo Grande", "Natal", "Teresina", "João Pessoa",
    "São Bernardo do Campo", "Santo André", "Ribeirão Preto", "Uberlândia", "Sorocaba", "Cuiabá", "Aracaju", "Florianópolis", "Londrina", "Porto Velho",
    "Caxias do Sul", "Juiz de Fora", "Niterói", "Boa Vista", "Macapá", "Feira de Santana", "São José dos Campos", "Maringá", "Piracicaba", "Campina Grande",
    "São Gonçalo", "Mauá", "Osasco", "Mogi das Cruzes", "Anápolis", "Blumenau", "Contagem", "Bauru", "Uberaba", "Petrópolis",
    "Criciúma", "Tubarão", "Palhoça", "Balneário Camboriú", "Joinville", "Itajaí", "Chapecó", "Lages", "Canoas", "Santa Maria",
    "Novo Hamburgo", "São Leopoldo", "Viamão", "Alvorada", "Cachoeirinha", "Gravataí", "Bagé", "Pelotas", "Rio Grande", "Uruguaiana"
  ],
  BG: [
    "Sofia", "Plovdiv", "Varna", "Burgas", "Ruse", "Stara Zagora", "Pleven", "Sliven", "Dobrich", "Shumen",
    "Pernik", "Veliko Tarnovo", "Blagoevgrad", "Razgrad", "Pazardzhik", "Gabrovo", "Vratsa", "Kardzhali", "Kyustendil", "Montana",
    "Lovech", "Targovishte", "Yambol", "Silistra", "Vidin", "Smolyan", "Haskovo", "Dimitrovgrad", "Kazanlak", "Lom",
    "Karlovo", "Svishtov", "Dupnitsa", "Petrich", "Sandanski", "Samokov", "Sevlievo", "Nova Zagora", "Velingrad", "Troyan"
  ],
  CA: [
    "Toronto", "Montreal", "Vancouver", "Calgary", "Edmonton", "Ottawa", "Winnipeg", "Quebec City", "Hamilton", "Kitchener",
    "London", "Halifax", "St. Catharines", "Oshawa", "Victoria", "Windsor", "Saskatoon", "Regina", "Mississauga", "Brampton",
    "Surrey", "Laval", "Longueuil", "Gatineau", "Vaughan", "Burnaby", "Richmond", "Markham", "Oakville", "Burlington",
    "Abbotsford", "Sudbury", "St. John's", "Barrie", "Kelowna", "Sherbrooke", "Trois-Rivières", "Thunder Bay", "Moncton", "Guelph",
    "Saint John", "Peterborough", "Lethbridge", "Prince George", "Medicine Hat", "Sarnia", "Chilliwack", "Belleville", "North Bay", "Fredericton",
    "Granby", "Saint-Jean-sur-Richelieu", "Drummondville", "Saint-Jérôme", "Mirabel", "Blainville", "Boisbriand", "Repentigny", "Terrebonne", "Brossard",
    "Saint-Hyacinthe", "Joliette", "Rimouski", "Rouyn-Noranda", "Val-d'Or", "Saguenay", "Alma", "Sept-Îles", "Baie-Comeau", "Kingston"
  ],
  CI: [
    "Abidjan", "Yamoussoukro", "Bouaké", "Daloa", "Korhogo", "Gagnoa", "San-Pédro", "Man", "Divo", "Abengourou",
    "Soubré", "Odienné", "Bondoukou", "Séguéla", "Ferkessédougou", "Touba", "Boundiali", "Agboville", "Dabou", "Grand-Bassam",
    "Jacqueville", "Assinie", "Adiaké", "Tiassalé", "Toumodi", "Bongouanou", "Daoukro", "Agnibilékrou", "Tanda", "Béoumi"
  ],
  CM: [
    "Douala", "Yaoundé", "Garoua", "Bamenda", "Maroua", "Bafoussam", "Nkongsamba", "Ngaoundéré", "Bertoua", "Ebolowa",
    "Kumba", "Buea", "Limbe", "Edéa", "Foumban", "Mokolo", "Bafang", "Dschang", "Sangmélima", "Kribi",
    "Batouri", "Mbalmayo", "Guider", "Mbouda", "Yagoua", "Tiko", "Mamfe", "Obala", "Eséka", "Abong-Mbang",
    "Bogo", "Kaele", "Mora", "Kousseri", "Yokadouma", "Meiganga", "Tibati", "Wum", "Kumbo", "Fundong"
  ],
  CN: [
    "Shanghai", "Beijing", "Guangzhou", "Shenzhen", "Chengdu", "Nanjing", "Wuhan", "Hangzhou", "Chongqing", "Tianjin",
    "Shenyang", "Ningbo", "Suzhou", "Xi'an", "Qingdao", "Dalian", "Foshan", "Zhengzhou", "Changsha", "Harbin",
    "Hefei", "Kunming", "Changchun", "Jinan", "Fuzhou", "Lanzhou", "Guiyang", "Nanning", "Wenzhou", "Zhuhai",
    "Xiamen", "Shijiazhuang", "Taiyuan", "Urumqi", "Hohhot", "Haikou", "Lhasa", "Yinchuan", "Xining", "Nanchang",
    "Wuxi", "Tangshan", "Zhongshan", "Dongguan", "Quanzhou", "Luoyang", "Handan", "Jilin", "Baotou", "Huaibei",
    "Xuzhou", "Changzhou", "Zibo", "Yantai", "Weifang", "Huizhou", "Liuzhou", "Guiyang", "Mianyang", "Nantong"
  ],
  CO: [
    "Bogotá", "Medellín", "Cali", "Barranquilla", "Cartagena", "Cúcuta", "Bucaramanga", "Pereira", "Santa Marta", "Ibagué",
    "Manizales", "Pasto", "Neiva", "Villavicencio", "Armenia", "Popayán", "Sincelejo", "Montería", "Valledupar", "Tunja",
    "Florencia", "Riohacha", "Yopal", "Mocoa", "Quibdó", "Inírida", "Mitú", "Puerto Carreño", "San José del Guaviare", "Leticia",
    "Barrancabermeja", "Buga", "Girardot", "Duitama", "Sogamoso", "Zipaquirá", "Piedecuesta", "Floridablanca", "Rionegro", "Itagüí",
    "Envigado", "La Estrella", "Caldas", "Sabaneta", "Copacabana", "Girardota", "Barbosa", "Santo Tomás", "Soledad", "Malambo"
  ],
  CD: [
    "Kinshasa", "Lubumbashi", "Mbuji-Mayi", "Kisangani", "Bukavu", "Kananga", "Goma", "Likasi", "Kolwezi", "Boma",
    "Uvira", "Kikwit", "Mbandaka", "Matadi", "Beni", "Bunia", "Isiro", "Butembo", "Mwene-Ditu", "Tshikapa",
    "Gbadolite", "Kindu", "Kamina", "Binga", "Kipushi", "Gemena", "Bandundu", "Boende", "Lisala", "Bumba",
    "Kenge", "Kasongo", "Kalemie", "Kabinda", "Lodja", "Ilebo", "Kabalo", "Kongolo", "Moba", "Manono"
  ],
  HR: [
    "Zagreb", "Split", "Rijeka", "Osijek", "Zadar", "Slavonski Brod", "Pula", "Dubrovnik", "Karlovac", "Varaždin",
    "Šibenik", "Sisak", "Velika Gorica", "Vinkovci", "Koprivnica", "Čakovec", "Đakovo", "Požega", "Vukovar", "Bjelovar",
    "Samobor", "Makarska", "Trogir", "Rovinj", "Zaprešić", "Kutina", "Petrinja", "Metković", "Omiš", "Poreč",
    "Zupanja", "Nova Gradiska", "Daruvar", "Našice", "Slatina", "Orahovica", "Ilok", "Vodice", "Biograd na Moru", "Imotski"
  ],
  CZ: [
    "Prague", "Brno", "Ostrava", "Plzeň", "Liberec", "Olomouc", "České Budějovice", "Hradec Králové", "Ústí nad Labem", "Pardubice",
    "Zlín", "Havířov", "Kladno", "Most", "Karviná", "Opava", "Frýdek-Místek", "Karlovy Vary", "Jihlava", "Teplice",
    "Děčín", "Chomutov", "Prostějov", "Třebíč", "Mladá Boleslav", "Přerov", "Benešov", "Kroměříž", "Náchod", "Česká Lípa",
    "Litoměřice", "Beroun", "Jablonec nad Nisou", "Trutnov", "Tábor", "Český Krumlov", "Kolín", "Kutná Hora", "Hodonín", "Blansko"
  ],
  DK: [
    "Copenhagen", "Aarhus", "Odense", "Aalborg", "Esbjerg", "Randers", "Kolding", "Horsens", "Vejle", "Roskilde",
    "Herning", "Silkeborg", "Fredericia", "Helsingør", "Viborg", "Holstebro", "Slagelse", "Hillerød", "Næstved", "Hjørring",
    "Sønderborg", "Frederikshavn", "Haderslev", "Ringsted", "Skive", "Hobro", "Nykøbing Falster", "Nyborg", "Køge", "Kalundborg",
    "Struer", "Lemvig", "Thisted", "Skjern", "Tarm", "Varde", "Grindsted", "Billund", "Middelfart", "Assens"
  ],
  EG: [
    "Cairo", "Alexandria", "Giza", "Shubra El Kheima", "Port Said", "Suez", "Luxor", "Mansoura", "Tanta", "Asyut",
    "Ismailia", "Fayyum", "Zagazig", "Damietta", "Aswan", "Minya", "Beni Suef", "Sohag", "Hurghada", "Qena",
    "Banha", "Kafr el-Sheikh", "Arish", "Mallawi", "Bilbeis", "10th of Ramadan City", "Marsa Matruh", "Desouk", "Damanhur", "Samalut",
    "Sharm El Sheikh", "El Gouna", "Safaga", "Qusayr", "Idfu", "Kom Ombo", "Edfu", "Armant", "Esna", "Dairut",
    "Maghagha", "Abu Tig", "Tahta", "Tima", "Sohag", "Akhmim", "Girga", "Farshut", "Abnoub", "Manfalut"
  ],
  FI: [
    "Helsinki", "Espoo", "Tampere", "Vantaa", "Oulu", "Turku", "Jyväskylä", "Lahti", "Kuopio", "Pori",
    "Joensuu", "Lappeenranta", "Vaasa", "Rovaniemi", "Seinäjoki", "Kotka", "Mikkeli", "Hämeenlinna", "Kokkola", "Kajaani",
    "Rauma", "Nurmijärvi", "Ylöjärvi", "Järvenpää", "Lohja", "Kangasala", "Kerava", "Savonlinna", "Tuusula", "Kirkkonummi",
    "Imatra", "Riihimäki", "Varkaus", "Salo", "Forssa", "Iisalmi", "Kuusamo", "Tornio", "Kemi", "Pietarsaari"
  ],
  FR: [
    "Paris", "Marseille", "Lyon", "Toulouse", "Nice", "Nantes", "Strasbourg", "Montpellier", "Bordeaux", "Lille",
    "Rennes", "Reims", "Saint-Étienne", "Le Havre", "Dijon", "Grenoble", "Angers", "Villeurbanne", "Nîmes", "Clermont-Ferrand",
    "Le Mans", "Aix-en-Provence", "Brest", "Tours", "Amiens", "Limoges", "Metz", "Perpignan", "Besançon", "Orléans",
    "Rouen", "Mulhouse", "Nancy", "Montreuil", "Argenteuil", "Saint-Denis", "Avignon", "Poitiers", "Pau", "Calais",
    "Ajaccio", "Bastia", "Cayenne", "Saint-Denis (Réunion)", "Fort-de-France", "Pointe-à-Pitre", "Mamoudzou", "Nouméa", "Papeete", "Saint-Paul",
    "Béziers", "Bourg-en-Bresse", "Bourges", "Cannes", "Chartres", "Colmar", "Douai", "Dunkerque", "Gap", "Laval",
    "Lorient", "Macon", "Mérignac", "Montauban", "Nevers", "Niort", "Quimper", "Roanne", "Saint-Malo", "Troyes",
    "Valence", "Vannes", "Versailles", "Auxerre", "Bastia", "Draguignan", "Aubagne", "Martigues", "Salon-de-Provence", "Vitrolles"
  ],
  DE: [
    "Berlin", "Hamburg", "Munich", "Cologne", "Frankfurt", "Stuttgart", "Düsseldorf", "Leipzig", "Dortmund", "Essen",
    "Bremen", "Dresden", "Hanover", "Nuremberg", "Duisburg", "Bochum", "Bonn", "Mannheim", "Bielefeld", "Karlsruhe",
    "Wiesbaden", "Münster", "Aachen", "Augsburg", "Krefeld", "Bremenhaven", "Kiel", "Magdeburg", "Halle", "Freiburg",
    "Rostock", "Mainz", "Lübeck", "Kassel", "Potsdam", "Darmstadt", "Erfurt", "Oberhausen", "Ludwigshafen", "Saarbrücken",
    "Würzburg", "Heidelberg", "Regensburg", "Hildesheim", "Göttingen", "Flensburg", "Ingolstadt", "Koblenz", "Trier", "Ulm",
    "Recklinghausen", "Gelsenkirchen", "Mönchengladbach", "Wuppertal", "Solingen", "Remscheid", "Leverkusen", "Neuss", "Bottrop", "Gladbeck",
    "Oldenburg", "Osnabrück", "Salzgitter", "Wolfenbüttel", "Goslar", "Celle", "Lüneburg", "Stade", "Wilhelmshaven", "Emden"
  ],
  GH: [
    "Accra", "Kumasi", "Tamale", "Sekondi-Takoradi", "Ashaiman", "Tema", "Koforidua", "Cape Coast", "Wa", "Ho",
    "Sunyani", "Bolgatanga", "Bawku", "Nkawkaw", "Obuasi", "Dunkwa-on-Offin", "Winneba", "Kasoa", "Mampong", "Konongo",
    "Asamankese", "Keta", "Berekum", "Navrongo", "Hohoe", "Aflao", "Yendi", "Savelugu", "Nalerigu", "Damango",
    "Tarkwa", "Prestea", "Akosombo", "Aburi", "Nsawam", "Kibi", "Kade", "Oda", "Akim Swedru", "Begoro"
  ],
  GR: [
    "Athens", "Thessaloniki", "Patras", "Heraklion", "Larissa", "Volos", "Ioannina", "Kavala", "Chania", "Rhodes",
    "Kalamata", "Veria", "Katerini", "Alexandroupoli", "Tripoli", "Serres", "Lamia", "Kozani", "Komotini", "Mytilene",
    "Sparta", "Chalkida", "Karditsa", "Corinth", "Piraeus", "Eleusis", "Kerkyra", "Rethymno", "Drama", "Florina",
    "Xanthi", "Orestiada", "Didymoteicho", "Ptolemaida", "Kastoria", "Grevena", "Arta", "Preveza", "Argostoli", "Zakynthos"
  ],
  HU: [
    "Budapest", "Debrecen", "Szeged", "Miskolc", "Pécs", "Győr", "Nyíregyháza", "Kecskemét", "Székesfehérvár", "Szombathely",
    "Szolnok", "Tatabánya", "Kaposvár", "Érd", "Veszprém", "Békéscsaba", "Zalaegerszeg", "Sopron", "Eger", "Nagykanizsa",
    "Dunaújváros", "Hódmezővásárhely", "Salgótarján", "Baja", "Mosonmagyaróvár", "Gyöngyös", "Hajdúszoboszló", "Ózd", "Kazincbarcika", "Gödöllő",
    "Szentendre", "Szigetszentmiklós", "Szentgotthárd", "Sárvár", "Keszthely", "Balatonfüred", "Siófok", "Tata", "Esztergom", "Hatvan"
  ],
  IN: [
    "Mumbai", "Delhi", "Bengaluru", "Hyderabad", "Ahmedabad", "Chennai", "Kolkata", "Surat", "Pune", "Jaipur",
    "Lucknow", "Kanpur", "Nagpur", "Indore", "Thane", "Bhopal", "Visakhapatnam", "Patna", "Vadodara", "Ghaziabad",
    "Ludhiana", "Agra", "Nashik", "Faridabad", "Meerut", "Rajkot", "Varanasi", "Srinagar", "Aurangabad", "Dhanbad",
    "Amritsar", "Navsari", "Allahabad", "Ranchi", "Howrah", "Coimbatore", "Jabalpur", "Gwalior", "Vijayawada", "Jodhpur",
    "Madurai", "Raipur", "Kota", "Chandigarh", "Guwahati", "Solapur", "Hubli", "Mysore", "Tiruchirappalli", "Bareilly",
    "Moradabad", "Aligarh", "Jamshedpur", "Bhiwandi", "Gorakhpur", "Ujjain", "Salem", "Bhilai", "Warangal", "Guntur"
  ],
  ID: [
    "Jakarta", "Surabaya", "Bandung", "Medan", "Semarang", "Makassar", "Palembang", "Tangerang", "Depok", "Bekasi",
    "Surakarta", "Denpasar", "Bogor", "Manado", "Malang", "Yogyakarta", "Pekanbaru", "Banjarmasin", "Padang", "Samarinda",
    "Pontianak", "Batam", "Balikpapan", "Jambi", "Mataram", "Kupang", "Ambon", "Kendari", "Palu", "Gorontalo",
    "Ternate", "Tarakan", "Singkawang", "Lubuklinggau", "Metro", "Pagar Alam", "Sebangau", "Dumai", "Cilegon", "Bontang",
    "Sorong", "Jayapura", "Merauke", "Timika", "Nabire", "Biak", "Manokwari", "Fakfak", "Tual", "Kaimana"
  ],
  IR: [
    "Tehran", "Mashhad", "Isfahan", "Karaj", "Tabriz", "Shiraz", "Qom", "Ahvaz", "Kermanshah", "Urmia",
    "Rasht", "Zahedan", "Hamadan", "Kerman", "Yazd", "Ardabil", "Bandar Abbas", "Arak", "Sari", "Qazvin",
    "Sanandaj", "Birjand", "Khorramabad", "Bushehr", "Shahr-e Kord", "Bojnord", "Semnan", "Yasuj", "Mianeh", "Gorgan",
    "Maragheh", "Dezful", "Borujerd", "Malayer", "Iranshahr", "Chabahar", "Kashan", "Sabzevar", "Neyshabur", "Torbat-e Heydarieh"
  ],
  IQ: [
    "Baghdad", "Basra", "Mosul", "Erbil", "Kirkuk", "Najaf", "Karbala", "Sulaymaniyah", "Nasiriyah", "Amara",
    "Fallujah", "Ramadi", "Duhok", "Hillah", "Kut", "Samarra", "Tikrit", "Diwaniyah", "Zakho", "Ba'qubah",
    "Sinjar", "Tal Afar", "Haditha", "Rutba", "Balad", "Taji", "Qaim", "Tuz Khurmatu", "Chamchamal", "Halabja",
    "Kufa", "Samawah", "Ali al-Gharbi", "Suq al-Shuyukh", "Al-Miqdadiya", "Kifri", "Akra", "Shaqlawa", "Ranya", "Koysinjaq"
  ],
  IE: [
    "Dublin", "Cork", "Limerick", "Galway", "Waterford", "Drogheda", "Kilkenny", "Dundalk", "Bray", "Tralee",
    "Celbridge", "Swords", "Navan", "Naas", "Sligo", "Ennis", "Mullingar", "Carlow", "Wexford", "Monaghan",
    "Athlone", "Letterkenny", "Clonmel", "Longford", "Portlaoise", "Castlebar", "Tullamore", "Ballina", "Arklow", "Greystones",
    "Skerries", "Malahide", "Balbriggan", "Rush", "Lusk", "Donabate", "Wicklow", "Gorey", "New Ross", "Carrick-on-Suir"
  ],
  IT: [
    "Rome", "Milan", "Naples", "Turin", "Palermo", "Genoa", "Bologna", "Florence", "Catania", "Bari",
    "Venice", "Verona", "Messina", "Padua", "Trieste", "Taranto", "Brescia", "Parma", "Prato", "Modena",
    "Reggio Calabria", "Perugia", "Livorno", "Ravenna", "Cagliari", "Foggia", "Rimini", "Salerno", "Ferrara", "Sassari",
    "Trento", "Ancona", "Lecce", "Bergamo", "Bolzano", "Piacenza", "Udine", "Lucca", "Arezzo", "Pisa",
    "Matera", "Potenza", "Catanzaro", "Lamezia Terme", "Cosenza", "Crotone", "Trapani", "Agrigento", "Ragusa", "Siracusa",
    "Siena", "Vicenza", "Treviso", "Belluno", "Pordenone", "Gorizia", "Aosta", "Campobasso", "Isernia", "Vibo Valentia"
  ],
  JP: [
    "Tokyo", "Yokohama", "Osaka", "Nagoya", "Sapporo", "Fukuoka", "Kobe", "Kyoto", "Kawasaki", "Saitama",
    "Hiroshima", "Sendai", "Chiba", "Kitakyushu", "Hamamatsu", "Niigata", "Okayama", "Kumamoto", "Kagoshima", "Kanazawa",
    "Toyota", "Nagasaki", "Gifu", "Himeji", "Matsuyama", "Takamatsu", "Toyama", "Fukuyama", "Nara", "Shizuoka",
    "Oita", "Morioka", "Akita", "Wakayama", "Aomori", "Kochi", "Tsu", "Fukui", "Tottori", "Yamagata",
    "Kofu", "Mito", "Utsunomiya", "Maebashi", "Nagano", "Tokushima", "Yamaguchi", "Naha", "Miyazaki", "Saga"
  ],
  JO: [
    "Amman", "Zarqa", "Irbid", "Russeifa", "Aqaba", "Madaba", "Jerash", "Salt", "Mafraq", "Karak",
    "Tafilah", "Ajloun", "Ma'an", "Ramtha", "Wadi Musa", "Fuheis", "Ba'qa", "Sarih", "Sahab", "Ruseifah",
    "Jubeiha", "Shafa Badran", "Tla' al-Ali", "Abu Nseir", "Umm al-Basatin", "Al-Jizah", "Na'ur", "Dhiban", "Mushayrfat", "Marka"
  ],
  KE: [
    "Nairobi", "Mombasa", "Kisumu", "Nakuru", "Eldoret", "Thika", "Malindi", "Kitale", "Nyeri", "Nanyuki",
    "Machakos", "Meru", "Garissa", "Embu", "Kakamega", "Bungoma", "Busia", "Homa Bay", "Naivasha", "Wajir",
    "Lamu", "Isiolo", "Marsabit", "Lodwar", "Moyale", "Mandera", "Migori", "Siaya", "Kericho", "Narok",
    "Kilifi", "Mtwapa", "Voi", "Nyahururu", "Karuri", "Ruiru", "Ongata Rongai", "Kikuyu", "Limuru", "Nairobi"
  ],
  XK: [
    "Pristina", "Prizren", "Peja", "Gjakova", "Mitrovica", "Ferizaj", "Gjilan", "Vushtrri", "Suhareka", "Rahovec",
    "Malisheva", "Leposaviq", "Zveçan", "Zubin Potok", "Deçan", "Istog", "Klinë", "Skenderaj", "Viti", "Lipjan",
    "Obiliq", "Gracanica", "Kamenica", "Ranilug", "Partesh", "Novobërdë", "Dragash", "Hani i Elezit", "Junik", "Mamushë"
  ],
  KW: [
    "Kuwait City", "Hawalli", "Farwaniya", "Salmiya", "Jahra", "Mangaf", "Fahaheel", "Shuwaikh", "Sabahiya", "Abdullah Port",
    "Abu Halifa", "Mahboula", "Sabahiya", "Qusour", "Bayan", "Mishref", "Andalus", "Surra", "Khaldiya", "Rabiya",
    "Shamiya", "Dasma", "Nuzha", "Faiha", "Shuhada", "Qadsia", "Rumaithiya", "Salwa", "Hassawi", "Eqeila"
  ],
  LY: [
    "Tripoli", "Benghazi", "Misrata", "Zawiya", "Bayda", "Tobruk", "Sirte", "Sabha", "Bani Walid", "Zliten",
    "Al Khums", "Zintan", "Derna", "Tajura", "Murzuq", "Ghat", "Ubari", "Gharyan", "Mizda", "Awjila",
    "Nalut", "Waddan", "Hun", "Jufra", "Qatrun", "Brak", "Idri", "Mourzouk", "Qarqaf", "Toummo"
  ],
  MY: [
    "Kuala Lumpur", "George Town", "Johor Bahru", "Ipoh", "Shah Alam", "Petaling Jaya", "Kota Kinabalu", "Kuching", "Melaka", "Alor Setar",
    "Kuantan", "Taiping", "Seremban", "Sandakan", "Kota Bharu", "Tawau", "Sibu", "Kangar", "Batu Pahat", "Muar",
    "Kluang", "Lahad Datu", "Miri", "Bintulu", "Terengganu", "Kuala Terengganu", "Putrajaya", "Cyberjaya", "Kajang", "Ampang",
    "Selayang", "Rawang", "Subang Jaya", "Puchong", "Cheras", "Setapak", "Gombak", "Hulu Kelang", "Ulu Tiram", "Senai"
  ],
  MV: ["Malé", "Addu City", "Fuvahmulah", "Kulhudhuffushi", "Thinadhoo", "Naifaru", "Dhiddhoo", "Muli", "Veymandoo", "Fonadhoo", "Eydhafushi", "Manadhoo", "Ungoofaaru", "Funadhoo"],
  MT: ["Valletta", "Birkirkara", "Mosta", "Sliema", "San Gwann", "Qormi", "St. Paul's Bay", "Rabat", "Zabbar", "Naxxar", "Attard", "Balzan", "Iklin", "Lija", "Mellieħa"],
  MX: [
    "Mexico City", "Guadalajara", "Monterrey", "Puebla", "Tijuana", "León", "Ciudad Juárez", "Zapopan", "Cancún", "Nezahualcóyotl",
    "Ecatepec", "Mérida", "San Luis Potosí", "Aguascalientes", "Mexicali", "Hermosillo", "Morelia", "Chihuahua", "Naucalpan", "Toluca",
    "Querétaro", "Culiacán", "Saltillo", "Torreón", "Durango", "Tuxtla Gutiérrez", "Reynosa", "Irapuato", "Apodaca", "Acapulco",
    "Xalapa", "Nuevo Laredo", "Tampico", "Mazatlán", "Campeche", "Oaxaca", "Cuernavaca", "Pachuca", "Villahermosa", "Colima",
    "Celaya", "Guanajuato", "Zacatecas", "Tepic", "Chetumal", "La Paz", "Los Cabos", "Ensenada", "Rosarito", "Mexicali"
  ],
  MA: [
    "Casablanca", "Rabat", "Marrakesh", "Fez", "Tangier", "Agadir", "Meknes", "Oujda", "Kenitra", "Tetouan",
    "Safi", "Salé", "El Jadida", "Beni Mellal", "Nador", "Taza", "Mohammedia", "Laâyoune", "Khouribga", "Settat",
    "Essaouira", "Guelmim", "Ouarzazate", "Al Hoceima", "Dakhla", "Ifrane", "Azrou", "Ksar el-Kebir", "Larache", "Taourirt",
    "Berrechid", "Sidi Kacem", "Tiflet", "Sefrou", "Taounate", "Tiznit", "Tinghir", "Zagora", "Sidi Ifni", "Taroudant",
    "El Kelaa des Sraghna", "Youssoufia", "Skhirate", "Temara", "Ain Harrouda", "Bouskoura", "Médiouna", "Nouaceur", "Bir Jdid", "Azemmour"
  ],
  MZ: [
    "Maputo", "Matola", "Beira", "Nampula", "Chimoio", "Quelimane", "Tete", "Xai-Xai", "Inhambane", "Lichinga",
    "Pemba", "Angoche", "Mocuba", "Manica", "Dondo", "Vilanculos", "Chokwe", "Maxixe", "Cuamba", "Montepuez",
    "Nacala", "Ilha de Moçambique", "Gurúè", "Moatize", "Ressano Garcia", "Boane", "Manhiça", "Marracuene", "Namialo", "Mecuburi"
  ],
  NL: [
    "Amsterdam", "Rotterdam", "The Hague", "Utrecht", "Eindhoven", "Groningen", "Tilburg", "Almere", "Breda", "Nijmegen",
    "Enschede", "Haarlem", "Arnhem", "Zaanstad", "Amersfoort", "Apeldoorn", "Den Bosch", "Zwolle", "Leeuwarden", "Leiden",
    "Maastricht", "Dordrecht", "Delft", "Heerlen", "Venlo", "Gouda", "Hilversum", "Assen", "Lelystad", "Middelburg",
    "Helmond", "Deventer", "Alkmaar", "Hengelo", "Roermond", "Sittard", "Geleen", "Vlissingen", "Terneuzen", "Goes"
  ],
  NZ: [
    "Auckland", "Wellington", "Christchurch", "Hamilton", "Tauranga", "Napier", "Dunedin", "Palmerston North", "New Plymouth", "Whangārei",
    "Invercargill", "Rotorua", "Hastings", "Gisborne", "Nelson", "Blenheim", "Queenstown", "Masterton", "Timaru", "Ashburton",
    "Cambridge", "Taupō", "Pukekohe", "Whakatāne", "Waitakere", "Porirua", "Lower Hutt", "Upper Hutt", "Māngere", "Howick",
    "Papakura", "Manurewa", "North Shore", "Hibiscus Coast", "Paraparaumu", "Kapiti", "Fielding", "Levin", "Tokoroa", "Te Puke"
  ],
  NG: [
    "Lagos", "Kano", "Ibadan", "Abuja", "Port Harcourt", "Benin City", "Maiduguri", "Zaria", "Aba", "Jos",
    "Ilorin", "Oyo", "Enugu", "Kaduna", "Bauchi", "Warri", "Uyo", "Ogbomoso", "Sokoto", "Ondo City",
    "Akure", "Ado Ekiti", "Abeokuta", "Ikeja", "Nnewi", "Yola", "Umuahia", "Calabar", "Katsina", "Minna",
    "Awka", "Onitsha", "Nsukka", "Okene", "Gusau", "Birnin Kebbi", "Kontagora", "Jalingo", "Damaturu", "Gombe",
    "Suleja", "Bida", "Keffi", "Lafia", "Makurdi", "Otukpo", "Gboko", "Katsina-Ala", "Ikom", "Ogoja"
  ],
  NO: [
    "Oslo", "Bergen", "Trondheim", "Stavanger", "Drammen", "Fredrikstad", "Kristiansand", "Tromsø", "Sandnes", "Bodø",
    "Sarpsborg", "Skien", "Ålesund", "Haugesund", "Sandefjord", "Arendal", "Porsgrunn", "Gjøvik", "Molde", "Larvik",
    "Lillehammer", "Harstad", "Tønsberg", "Kongsberg", "Hamar", "Moss", "Alta", "Vadsø", "Kirkenes", "Vardø",
    "Narvik", "Mo i Rana", "Mosjøen", "Steinkjer", "Namsos", "Levanger", "Stjørdal", "Verdal", "Rørvik", "Brønnøysund"
  ],
  PK: [
    "Karachi", "Lahore", "Faisalabad", "Rawalpindi", "Multan", "Peshawar", "Islamabad", "Quetta", "Sargodha", "Sialkot",
    "Gujranwala", "Jhang", "Sheikhupura", "Larkana", "Sukkur", "Rahim Yar Khan", "Mardan", "Kasur", "Hyderabad", "Nawabshah",
    "Abbottabad", "Mirpur", "Sahiwal", "Bahawalpur", "Gwadar", "Mingora", "Okara", "Kotli", "Muzaffarabad", "Chiniot",
    "Hafizabad", "Mandi Bahauddin", "Jhelum", "Gujrat", "Kharian", "Daska", "Kamoke", "Muridke", "Wazirabad", "Vehari"
  ],
  PS: [
    "Gaza", "Ramallah", "Nablus", "Bethlehem", "Jericho", "Hebron", "Jenin", "Tulkarm", "Qalqilya", "Salfit",
    "Tubas", "Deir al-Balah", "Khan Yunis", "Rafah", "Beita", "Beit Lahia", "Al-Bireh", "Abasan", "Beit Jala", "Beit Sahour",
    "Jerusalem", "Al-Quds", "Abu Dis", "Bethany", "Birzeit", "Halhul", "Yatta", "Dura", "Eizariya", "Ram",
    "Jayyous", "Bani Na'im", "Samu", "Sa'ir", "Azun", "Anabta", "Ya'bad", "Kafr al-Labad", "Aqaba", "Al-Zeitoun"
  ],
  PE: [
    "Lima", "Arequipa", "Cusco", "Trujillo", "Chiclayo", "Piura", "Iquitos", "Huancayo", "Chimbote", "Tacna",
    "Cajamarca", "Pucallpa", "Juliaca", "Ayacucho", "Huánuco", "Ica", "Sullana", "Puerto Maldonado", "Abancay", "Cerro de Pasco",
    "Tingo María", "Chachapoyas", "Yurimaguas", "Andahuaylas", "Moquegua", "Puno", "Jauja", "Huacho", "Bagua", "Moyobamba",
    "Juli", "Ilave", "Azangaro", "Lampa", "Putina", "Huancane", "Juliaca", "Sicuani", "Espinar", "Canchis"
  ],
  PH: [
    "Manila", "Quezon City", "Cebu City", "Davao City", "Makati", "Pasig", "Antipolo", "Cagayan de Oro", "Taguig", "Zamboanga City",
    "General Santos", "Bacolod", "Iloilo City", "Pasay", "Muntinlupa", "Caloocan", "Paranaque", "Marikina", "Baguio", "Las Piñas",
    "Butuan", "Cabanatuan", "San Pedro", "Batangas City", "Naga", "Libmanan", "Malolos", "Olongapo", "Mabalacat", "Dagupan",
    "Angeles City", "San Fernando", "Tarlac City", "Ormoc", "Tacloban", "Roxas City", "Kalibo", "Tagbilaran", "Dumaguete", "Dipolog"
  ],
  PL: [
    "Warsaw", "Kraków", "Łódź", "Wrocław", "Poznań", "Gdańsk", "Szczecin", "Bydgoszcz", "Lublin", "Białystok",
    "Katowice", "Gdynia", "Częstochowa", "Radom", "Toruń", "Kielce", "Rzeszów", "Gliwice", "Zabrze", "Olsztyn",
    "Bielsko-Biała", "Tychy", "Bytom", "Rybnik", "Zielona Góra", "Ruda Śląska", "Opole", "Elbląg", "Gorzów Wielkopolski", "Płock",
    "Tarnów", "Koszalin", "Legnica", "Słupsk", "Jaworzno", "Jastrzębie-Zdrój", "Nowy Sącz", "Konin", "Kalisz", "Siedlce"
  ],
  PT: [
    "Lisbon", "Porto", "Braga", "Coimbra", "Funchal", "Amadora", "Setúbal", "Almada", "Aveiro", "Vila Nova de Gaia",
    "Portimão", "Faro", "Leiria", "Viseu", "Ponta Delgada", "Santarém", "Evora", "Castelo Branco", "Guimarães", "Viana do Castelo",
    "Cascais", "Oeiras", "Sintra", "Loures", "Odivelas", "Matosinhos", "Maia", "Gondomar", "Valongo", "Vila Franca de Xira",
    "Póvoa de Varzim", "Vila do Conde", "Espinho", "Feira", "Oliveira de Azeméis", "São João da Madeira", "Torres Vedras", "Caldas da Rainha", "Peniche", "Albufeira"
  ],
  QA: [
    "Doha", "Al Rayyan", "Al Wakrah", "Umm Salal", "Al Khor", "Al Shamal", "Dukhan", "Mesaieed", "Lusail", "Al Ghuwariyah",
    "Al Daayen", "Ar Rayyan", "Ash Shahaniyah", "Az Za'ayin", "Umm Bab", "Al Jumaliyah", "Al Kharaitiyat", "Al Sailiya", "Fereej Abdel Aziz", "Madinat Khalifa"
  ],
  RO: [
    "Bucharest", "Cluj-Napoca", "Timișoara", "Iași", "Constanța", "Brașov", "Sibiu", "Oradea", "Arad", "Pitești",
    "Galați", "Brăila", "Târgu Mureș", "Bacău", "Suceava", "Botoșani", "Craiova", "Ploiești", "Râmnicu Vâlcea", "Baia Mare",
    "Satu Mare", "Drobeta-Turnu Severin", "Focșani", "Târgoviște", "Bistrița", "Slatina", "Vaslui", "Turnu Măgurele", "Călărași", "Giurgiu",
    "Deva", "Hunedoara", "Alba Iulia", "Sighișoara", "Mediaș", "Reșița", "Lugoj", "Caransebeș", "Zalău", "Odorheiu Secuiesc"
  ],
  RU: [
    "Moscow", "Saint Petersburg", "Novosibirsk", "Yekaterinburg", "Kazan", "Nizhny Novgorod", "Chelyabinsk", "Samara", "Omsk", "Rostov-on-Don",
    "Ufa", "Krasnoyarsk", "Voronezh", "Perm", "Volgograd", "Krasnodar", "Saratov", "Tyumen", "Tolyatti", "Izhevsk",
    "Barnaul", "Ulyanovsk", "Irkutsk", "Kemerovo", "Novokuznetsk", "Ryazan", "Astrakhan", "Tula", "Penza", "Kirov",
    "Lipetsk", "Cheboksary", "Kaliningrad", "Makhachkala", "Tver", "Vladivostok", "Murmansk", "Sochi", "Kursk", "Ulan-Ude",
    "Naberezhnye Chelny", "Stavropol", "Magnitogorsk", "Nizhny Tagil", "Kurgan", "Surgut", "Arkhangelsk", "Belgorod", "Orenburg", "Chita"
  ],
  SA: [
    "Riyadh", "Jeddah", "Mecca", "Medina", "Dammam", "Khobar", "Tabuk", "Taif", "Yanbu", "Buraydah",
    "Abha", "Khamis Mushait", "Najran", "Jubail", "Hail", "Qatif", "Jizan", "Hofuf", "Dhahran", "Al Bahah",
    "Arar", "Sakaka", "Rafha", "Turubah", "Al Khafji", "Al Qunfudhah", "Al Zulfi", "Al Mithnab", "Ad Dawadimi", "Al Majma'ah",
    "Unaizah", "Riyadh Al Khabra", "Al Bukayriyah", "Al Badayea", "Al Hilaliya", "Sabya", "Abu Arish", "Samtah", "Al Dayer", "Farshan"
  ],
  SN: [
    "Dakar", "Thiès", "Saint-Louis", "Kaolack", "Ziguinchor", "Touba", "Mbour", "Diourbel", "Louga", "Fatick",
    "Kolda", "Tambacounda", "Kédougou", "Sédhiou", "Matam", "Podor", "Dagana", "Kaffrine", "Gossas", "Mbacké",
    "Médina", "Pikine", "Guediawaye", "Bargny", "Rufisque", "Bambilor", "Sébikhotane", "Diamniadio", "Tivaouane", "Kébémer"
  ],
  RS: [
    "Belgrade", "Novi Sad", "Niš", "Kragujevac", "Subotica", "Zrenjanin", "Pančevo", "Čačak", "Kruševac", "Kraljevo",
    "Novi Pazar", "Smederevo", "Leskovac", "Valjevo", "Vranje", "Šabac", "Užice", "Požarevac", "Pirot", "Prokuplje",
    "Sombor", "Kikinda", "Vršac", "Ruma", "Bačka Palanka", "Inđija", "Stara Pazova", "Sremska Mitrovica", "Loznica", "Jagodina"
  ],
  SG: [
    "Singapore", "Woodlands", "Tampines", "Jurong West", "Bedok", "Hougang", "Sengkang", "Choa Chu Kang", "Toa Payoh", "Bukit Merah",
    "Serangoon", "Geylang", "Punggol", "Kallang", "Clementi", "Bukit Panjang", "Pasir Ris", "Ang Mo Kio", "Queenstown", "Yishun"
  ],
  SK: [
    "Bratislava", "Košice", "Prešov", "Žilina", "Nitra", "Banská Bystrica", "Trnava", "Martin", "Trenčín", "Poprad",
    "Prievidza", "Zvolen", "Považská Bystrica", "Michalovce", "Spišská Nová Ves", "Komárno", "Humené", "Levice", "Bardejov", "Liptovský Mikuláš",
    "Ružomberok", "Dubnica nad Váhom", "Partizánske", "Šaľa", "Hlohovec", "Senica", "Nové Zámky", "Skalica", "Holíč", "Stará Ľubovňa"
  ],
  SI: [
    "Ljubljana", "Maribor", "Celje", "Kranj", "Koper", "Velenje", "Novo Mesto", "Ptuj", "Trbovlje", "Kamnik",
    "Jesenice", "Nova Gorica", "Murska Sobota", "Škofja Loka", "Domžale", "Izola", "Kočevje", "Postojna", "Sežana", "Slovenj Gradec",
    "Grosuplje", "Litija", "Radovljica", "Ribnica", "Logatec", "Mengeš", "Medvode", "Ravne na Koroškem", "Črnomelj", "Ajdovščina"
  ],
  ZA: [
    "Johannesburg", "Cape Town", "Durban", "Pretoria", "Port Elizabeth", "Bloemfontein", "Pietermaritzburg", "Welkom", "Soweto", "Tembisa",
    "East London", "Vereeniging", "Kimberley", "Polokwane", "Nelspruit", "Rustenburg", "Mafikeng", "George", "Umtata", "Potchefstroom",
    "Stellenbosch", "Paarl", "Worcester", "Upington", "Springbok", "Klerksdorp", "Krugersdorp", "Randburg", "Brakpan", "Benoni",
    "Boksburg", "Springs", "Carletonville", "Odendaalsrus", "Sasolburg", "Vanderbijlpark", "Heidelberg", "Middelburg", "Belfast", "Bethal"
  ],
  KR: [
    "Seoul", "Busan", "Incheon", "Daegu", "Daejeon", "Gwangju", "Suwon", "Ulsan", "Yongin", "Seongnam",
    "Bucheon", "Jeonju", "Cheongju", "Ansan", "Changwon", "Anyang", "Pohang", "Uijeongbu", "Hwaseong", "Siheung",
    "Goyang", "Gimhae", "Jeju City", "Cheonan", "Wonju", "Chuncheon", "Gangneung", "Mokpo", "Suncheon", "Yeosu",
    "Gunsan", "Iksan", "Gyeongju", "Andong", "Gimcheon", "Sangju", "Mungyeong", "Yeongju", "Yeongcheon", "Pohang"
  ],
  ES: [
    "Madrid", "Barcelona", "Valencia", "Seville", "Zaragoza", "Málaga", "Murcia", "Palma", "Bilbao", "Alicante",
    "Córdoba", "Valladolid", "Vigo", "Gijón", "Granada", "San Sebastián", "Pamplona", "Santander", "Toledo", "Cáceres",
    "Salamanca", "Huelva", "Tarragona", "Lleida", "Castellón", "León", "Ourense", "Cadiz", "Albacete", "Logroño",
    "Burgos", "Santiago de Compostela", "Badajoz", "Almería", "Jaén", "Lugo", "Pontevedra", "Ávila", "Segovia", "Soria",
    "Zamora", "Cuenca", "Guadalajara", "Teruel", "Ciudad Real", "Lorca", "Talavera de la Reina", "Elche", "Benidorm", "Torrevieja"
  ],
  SE: [
    "Stockholm", "Gothenburg", "Malmö", "Uppsala", "Linköping", "Västerås", "Örebro", "Helsingborg", "Norrköping", "Jönköping",
    "Umeå", "Lund", "Gävle", "Borås", "Sundsvall", "Eskilstuna", "Halmstad", "Karlstad", "Luleå", "Kristianstad",
    "Karlskrona", "Skövde", "Kalmar", "Falun", "Visby", "Mariestad", "Trollhättan", "Östersund", "Växjö", "Kiruna",
    "Lidköping", "Motala", "Nyköping", "Landskrona", "Ängelholm", "Ystad", "Hässleholm", "Oskarshamn", "Västervik", "Enköping"
  ],
  CH: [
    "Zürich", "Geneva", "Basel", "Bern", "Lausanne", "St. Gallen", "Lucerne", "Winterthur", "Lugano", "Biel",
    "Thun", "Köniz", "Fribourg", "La Chaux-de-Fonds", "Schaffhausen", "Neuchâtel", "Vernier", "Zug", "Uster", "Sion",
    "Montreux", "Chur", "Aarau", "Wil", "Rapperswil", "Baden", "Wädenswil", "Allschwil", "Pully", "Meyrin",
    "Dietikon", "Olten", "Grenchen", "Solothurn", "Frauenfeld", "Kreuzlingen", "Buchs", "St. Moritz", "Interlaken", "Grindelwald"
  ],
  SY: [
    "Damascus", "Aleppo", "Homs", "Latakia", "Hama", "Deir ez-Zor", "Raqqa", "Hasaka", "Idlib", "Daraa",
    "Sweida", "Tartus", "Qamishli", "Manbij", "Afrin", "Azaz", "Jableh", "Masyaf", "Safita", "Baniyas",
    "Al-Sanamayn", "Izra", "Nawa", "Tadmur", "Muhradah", "Kafr Zita", "Talbiseh", "Rastan", "Jarabulus", "Al-Bab"
  ],
  TW: [
    "Taipei", "Kaohsiung", "Taichung", "Tainan", "Taoyuan", "New Taipei", "Keelung", "Hsinchu", "Chiayi", "Changhua",
    "Pingtung", "Yilan", "Hualien", "Taitung", "Nantou", "Miaoli", "Yunlin", "Penghu", "Kinmen", "Lienchiang",
    "Sanchong", "Zhonghe", "Banqiao", "Xinzhuang", "Xindian", "Tucheng", "Luzhou", "Shulin", "Danshui", "Yingge"
  ],
  TZ: [
    "Dar es Salaam", "Mwanza", "Arusha", "Mbeya", "Morogoro", "Tanga", "Zanzibar City", "Unguja", "Dodoma", "Kigoma",
    "Moshi", "Tabora", "Shinyanga", "Songea", "Bukoba", "Musoma", "Iringa", "Njombe", "Sumbawanga", "Bunda",
    "Mpanda", "Mbamba Bay", "Mtwara", "Lindi", "Bariadi", "Biharamulo", "Nzega", "Kakonko", "Ngudu", "Buseresere",
    "Singida", "Babati", "Same", "Mafinga", "Mbulu", "Kilosa", "Ifakara", "Kibaha", "Bagamoyo", "Chake Chake"
  ],
  TH: [
    "Bangkok", "Chiang Mai", "Phuket", "Pattaya", "Nonthaburi", "Hat Yai", "Nakhon Ratchasima", "Khon Kaen", "Udon Thani", "Nakhon Si Thammarat",
    "Chonburi", "Surat Thani", "Songkhla", "Chiang Rai", "Prachuap Khiri Khan", "Hua Hin", "Krabi", "Samut Prakan", "Rayong", "Phitsanulok",
    "Sakon Nakhon", "Trang", "Sukhothai", "Lopburi", "Ayutthaya", "Kanchanaburi", "Ratchaburi", "Suphan Buri", "Nakhon Sawan", "Chachoengsao",
    "Ubon Ratchathani", "Roi Et", "Maha Sarakham", "Si Sa Ket", "Surin", "Buriram", "Nong Khai", "Loei", "Phrae", "Nan"
  ],
  TN: [
    "Tunis", "Sfax", "Sousse", "Kairouan", "Bizerte", "Gabès", "Ariana", "Gafsa", "Monastir", "Ben Arous",
    "Médenine", "Nabeul", "Kasserine", "Tataouine", "Béja", "Siliana", "Le Kef", "Zaghouan", "Mahdia", "Kebili",
    "Tozeur", "Jendouba", "El Kef", "Manouba", "Sidi Bouzid", "Korba", "Hammamet", "La Marsa", "Le Bardo", "Mégrine",
    "Radès", "Ezzahra", "Hammam Lif", "Mourouj", "Fouchana", "Mornag", "Oued Ellil", "Tunis", "Menzel Bourguiba", "Menzel Temime",
    "Kelibia", "Haouaria", "El Haouaria", "Bou Argoub", "Grombalia", "Soliman", "Béni Khiar", "Dar Chaabane", "Menzel Bou Zelfa", "Bembla"
  ],
  TR: [
    "Istanbul", "Ankara", "Izmir", "Bursa", "Antalya", "Adana", "Konya", "Gaziantep", "Mersin", "Kayseri",
    "Eskişehir", "Diyarbakır", "Samsun", "Denizli", "Şanlıurfa", "Trabzon", "Malatya", "Erzurum", "Van", "Elazığ",
    "Manisa", "Kocaeli", "Sakarya", "Balıkesir", "Hatay", "Aydın", "Muğla", "Mardin", "Tekirdağ", "Isparta",
    "Antakya", "Çanakkale", "Edirne", "Bolu", "Kütahya", "Çorum", "Siirt", "Rize", "Giresun", "Ordu",
    "Kastamonu", "Tokat", "Afyonkarahisar", "Karaman", "Niğde", "Yozgat", "Aksaray", "Kırşehir", "Nevşehir", "Uşak"
  ],
  UG: [
    "Kampala", "Gulu", "Mbarara", "Jinja", "Mbale", "Entebbe", "Soroti", "Arua", "Lira", "Masaka",
    "Kasese", "Fort Portal", "Tororo", "Busia", "Kabale", "Hoima", "Iganga", "Mubende", "Mityana", "Kotido",
    "Moroto", "Nebbi", "Rukungiri", "Kitgum", "Pader", "Apac", "Adjumani", "Kayunga", "Kiboga", "Luwero",
    "Mukono", "Namasuba", "Kira", "Kawempe", "Makindye", "Nansana", "Wakiso", "Bombo", "Lugazi", "Njeru"
  ],
  UA: [
    "Kyiv", "Kharkiv", "Odesa", "Dnipro", "Lviv", "Zaporizhzhia", "Kryvyi Rih", "Mykolaiv", "Vinnytsia", "Poltava",
    "Chernihiv", "Cherkasy", "Sumy", "Zhytomyr", "Rivne", "Ivano-Frankivsk", "Ternopil", "Lutsk", "Uzhhorod", "Kropyvnytskyi",
    "Kremenchuk", "Bila Tserkva", "Melitopol", "Sievierodonetsk", "Kherson", "Nikopol", "Berdiansk", "Pavlohrad", "Konotop", "Brovary",
    "Kamianske", "Kramatorsk", "Sloviansk", "Mariupol", "Lysychansk", "Pokrovsk", "Bakhmut", "Chasiv Yar", "Dobropillia", "Myrnohrad"
  ],
  AE: [
    "Dubai", "Abu Dhabi", "Sharjah", "Ajman", "Ras Al Khaimah", "Fujairah", "Umm Al Quwain", "Al Ain", "Khor Fakkan", "Dibba Al-Fujairah",
    "Al Gharbia", "Madinat Zayed", "Ruwais", "Liwa Oasis", "Hatta", "Kalba", "Dhaid", "Ar-Rams", "Al Jazirah Al Hamra", "Al Madam",
    "Deira", "Bur Dubai", "Jumeirah", "Mirdif", "Al Barsha", "Dubai Marina", "Palm Jumeirah", "Jebel Ali", "Dubai Silicon Oasis", "Muhaisnah"
  ],
  GB: [
    "London", "Birmingham", "Manchester", "Glasgow", "Liverpool", "Leeds", "Sheffield", "Edinburgh", "Bristol", "Cardiff",
    "Leicester", "Coventry", "Nottingham", "Newcastle", "Southampton", "Portsmouth", "Brighton", "Belfast", "Aberdeen", "Derby",
    "Plymouth", "Wolverhampton", "Sunderland", "Stoke-on-Trent", "Swansea", "Middlesbrough", "Blackpool", "Hull", "Bradford", "Milton Keynes",
    "Reading", "Oxford", "Cambridge", "Exeter", "York", "Chester", "Bath", "Ipswich", "Norwich", "Peterborough",
    "Basildon", "Bournemouth", "Chelmsford", "Croydon", "Dundee", "Gateshead", "Huddersfield", "Kingston upon Thames", "Luton", "Newport",
    "Northampton", "Norwich", "Oldham", "Paisley", "Preston", "Rochdale", "Rotherham", "Slough", "Southend-on-Sea", "Stockport",
    "Swindon", "Walsall", "Watford", "Wigan", "Worcester", "Ayr", "Dumfries", "Greenock", "Inverness", "Kilmarnock"
  ],
  US: [
    "New York City", "Los Angeles", "Chicago", "Houston", "Phoenix", "Philadelphia", "San Antonio", "San Diego", "Dallas", "San Jose",
    "Austin", "Jacksonville", "Fort Worth", "Columbus", "Charlotte", "Indianapolis", "San Francisco", "Seattle", "Denver", "Nashville",
    "Washington D.C.", "Boston", "El Paso", "Detroit", "Memphis", "Portland", "Oklahoma City", "Las Vegas", "Louisville", "Baltimore",
    "Milwaukee", "Albuquerque", "Tucson", "Fresno", "Sacramento", "Mesa", "Kansas City", "Atlanta", "Omaha", "Colorado Springs",
    "Raleigh", "Long Beach", "Virginia Beach", "Miami", "Oakland", "Minneapolis", "Tampa", "Tulsa", "Arlington", "New Orleans",
    "Cleveland", "Bakersfield", "Tampa", "Aurora", "Honolulu", "Anaheim", "Santa Ana", "Riverside", "Corpus Christi", "Lexington",
    "Stockton", "St. Paul", "Cincinnati", "St. Louis", "Pittsburgh", "Greensboro", "Lincoln", "Plano", "Rochester", "Boise",
    "Spokane", "Tacoma", "Modesto", "Fontana", "Santa Clarita", "Oxnard", "Irvine", "Moreno Valley", "Glendale", "Huntington Beach"
  ],
  UY: [
    "Montevideo", "Salto", "Paysandú", "Las Piedras", "Rivera", "Maldonado", "Tacuarembó", "Melo", "Mercedes", "Artigas",
    "Minas", "San José de Mayo", "Durazno", "Florida", "Treinta y Tres", "Rocha", "San Carlos", "Pando", "Fray Bentos", "Trinidad",
    "Colonia del Sacramento", "Carmelo", "Nueva Palmira", "Juan Lacaze", "Punta del Este", "Atlántida", "Pinar", "Barros Blancos", "La Paz", "Canelones"
  ],
  UZ: [
    "Tashkent", "Samarkand", "Bukhara", "Nukus", "Andijan", "Namangan", "Fergana", "Qarshi", "Jizzakh", "Urgench",
    "Termez", "Navoiy", "Khiva", "Margilan", "Kokand", "Denau", "Shakhrisabz", "Chust", "Angren", "Gulistan",
    "Katta-Kurgan", "Kogon", "Shahrisabz", "Yangiabad", "Zaamin", "Parkent", "Chirchiq", "Bektemir", "Yangi Nishon", "Turtkul",
    "Nurafshon", "Buka", "Quva", "Rishtan", "Jomboy", "Ishtikhan", "Narpay", "Nurobod", "Oqtosh", "Paxtakor"
  ],
  VE: [
    "Caracas", "Maracaibo", "Valencia", "Barquisimeto", "Maracay", "Ciudad Guayana", "Barcelona", "Maturín", "Cumaná", "Ciudad Bolívar",
    "San Cristóbal", "Mérida", "Barinas", "Coro", "Cumaná", "Guanare", "Los Teques", "Tucupita", "La Asunción", "San Felipe",
    "Trujillo", "Cantaura", "El Tigre", "Anaco", "Acarigua", "Puerto Cabello", "Cabimas", "Valera", "Calabozo", "San Carlos",
    "Puerto La Cruz", "Porlamar", "Punto Fijo", "Cagua", "Turmero", "Charallave", "Santa Teresa", "Ocumare del Tuy", "Guarenas", "Guatire"
  ],
  VN: [
    "Ho Chi Minh City", "Hanoi", "Da Nang", "Haiphong", "Can Tho", "Nha Trang", "Hue", "Da Lat", "Vung Tau", "Quy Nhon",
    "Rach Gia", "Long Xuyen", "Phan Thiet", "Bien Hoa", "Thu Duc", "Thu Dau Mot", "My Tho", "Buon Ma Thuot", "Hoa Binh", "Cao Bang",
    "Lao Cai", "Son La", "Thai Nguyen", "Bac Ninh", "Hai Duong", "Nam Dinh", "Vinh", "Ha Tinh", "Dong Hoi", "Quang Ngai",
    "Pleiku", "Tuy Hoa", "Tam Ky", "Hoi An", "Ca Mau", "Tra Vinh", "Ben Tre", "Soc Trang", "Bac Lieu", "Ha Giang",
    "Phan Rang", "Phan Thiet", "Cam Ranh", "Hoi An", "Chau Doc", "Ha Tien", "Sa Dec", "Tan An", "Tan Chau", "Vinh Long"
  ],
  YE: [
    "Sana'a", "Aden", "Taiz", "Hodeidah", "Ibb", "Mukalla", "Dhamar", "Amran", "Sa'dah", "Zinjibar",
    "Al Hudaydah", "Al Ghaydah", "Hajjah", "Al Mahwit", "Shabwah", "Marib", "Al Bayda", "Lahij", "Yarim", "Rada",
    "Bayhan", "Ataq", "Seiyun", "Tarim", "Shibam", "Maitaq", "Dhamar", "Yarim", "Rada", "Jarash"
  ],
  ZM: [
    "Lusaka", "Ndola", "Kitwe", "Chipata", "Kabwe", "Livingstone", "Mufulira", "Chingola", "Luanshya", "Kasama",
    "Solwezi", "Mansa", "Kafue", "Mongu", "Mazabuka", "Choma", "Mpika", "Kansanshi", "Nchelenge", "Chinsali",
    "Mkushi", "Serenje", "Kapiri Mposhi", "Mumbwa", "Kaoma", "Senanga", "Sesheke", "Namwala", "Lundazi", "Chama"
  ],
  ZW: [
    "Harare", "Bulawayo", "Chitungwiza", "Mutare", "Gweru", "Kwekwe", "Kadoma", "Masvingo", "Marondera", "Zvishavane",
    "Chinhoyi", "Chegutu", "Kariba", "Hwange", "Shurugwi", "Victoria Falls", "Bindura", "Norton", "Redcliff", "Rusape",
    "Ruwa", "Epworth", "Chiredzi", "Chipinge", "Beitbridge", "Plumtree", "Gwanda", "Lupane", "Nkayi", "Inyati"
  ]
};

export function getCitiesByCountryCode(code) {
  return CITIES[code] || [];
}

// Build a searchable flat list with country info
const ALL_CITIES = [];
Object.entries(CITIES).forEach(([code, cityList]) => {
  cityList.forEach((city) => {
    ALL_CITIES.push({ code, city });
  });
});

export function searchCities(query, countryCode = null) {
  if (!query) return [];
  const q = query.toLowerCase();
  let filtered = ALL_CITIES;
  if (countryCode) {
    filtered = filtered.filter((c) => c.code === countryCode);
  }
  return filtered.filter((c) => c.city.toLowerCase().includes(q)).slice(0, 50);
}

export default CITIES;