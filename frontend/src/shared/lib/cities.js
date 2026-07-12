// World cities database grouped by country code
const CITIES = {
  AF: [
    "Kabul", "Herat", "Kandahar", "Mazar-i-Sharif", "Jalalabad", "Kunduz", "Ghazni", "Balkh", "Baghlan", "Gardez",
    "Khost", "Farah", "Puli Khumri", "Samangan", "Sar-e Pol", "Taloqan", "Maimana", "Sheberghan", "Zaranj", "Lashkargah",
    "Charikar", "Aybak", "Feyzabad", "Parun", "Nili", "Qalat", "Mehtar Lam", "Asadabad", "Mahmud Raqi",
    "Qal-e-Naw", "Chaghcharan", "Sharan", "Nawzad", "Marjah", "Sangin", "Gereshk", "Spin Boldak", "Urgun",
    "Andkhoy", "Shibarghan", "Aqcha", "Darvaz", "Eshkashem", "Fayzabad", "Hazarajat", "Khamyab", "Khash", "Mardyan"
  ],
  AL: [
    "Tirana", "Durrës", "Vlorë", "Elbasan", "Shkodër", "Fier", "Korçë", "Berat", "Lushnjë", "Lezhë",
    "Kavajë", "Pogradec", "Laç", "Gjirokastër", "Patos", "Krujë", "Kuçovë", "Sarandë", "Burrel", "Rrëshen",
    "Mamurras", "Bajram Curri", "Peshkopi", "Librazhd", "Çorovodë", "Ersekë", "Pukë", "Kukës", "Tepelenë", "Mirditë",
    "Shijak", "Sukth", "Fushë-Krujë", "Ballsh", "Maliq", "Prrenjas", "Gramsh", "Orikum", "Polican", "Milot"
  ],
  DZ: [
    "Algiers", "Oran", "Constantine", "Annaba", "Blida", "Sétif", "Djelfa", "Béjaïa", "Batna", "Tizi Ouzou",
    "Biskra", "Tébessa", "Mostaganem", "Tiaret", "Sidi Bel Abbès", "Médéa", "Mascara", "Béchar", "Tlemcen",
    "Souk Ahras", "Guelma", "Bou Saâda", "Bordj Bou Arréridj", "Jijel", "Laghouat", "Relizane", "Chlef", "Bouïra",
    "Mila", "El Eulma", "Saïda", "Ouargla", "El Oued", "Khenchela", "Azzaba", "Aflou", "Oum el Bouaghi", "Mansourah",
    "Cheraga", "Draria", "El Harrach", "Hussein Dey", "Kouba", "Mohammadia", "Oued Smar", "Reghaïa",
    "Rouiba", "Staouéli", "Zeralda", "Beni Saf", "Es Senia", "Frenda", "Gdyel", "Hassi Messaoud", "Meftah",
    "Arzew", "Bir el Djir", "Boufarik", "Dar el Beïda", "Douéra", "El Achour", "El Biar", "Hydra",
    "Oued El Alleug", "Sidi M'Hamed", "Bab El Oued", "Belouizdad", "Bologhine", "Bouzareah", "Caserbah",
    "Hussein Dey", "Kouba", "Mohammadia", "Oued Smar", "Reghaïa", "Rouiba", "Staouéli", "Zeralda",
    "Aïn Taya", "Birkhadem", "Birtouta", "Bordj El Kiffan", "Bordj Menaïel", "Dergana", "El Harrach", "El Magharia",
    "Gue de Constantine", "Hussein Dey", "Les Eucalyptus", "Sidi Moussa", "Tamentfoust", "Aïn Bessem", "Aïn Oussera",
    "Boumerdès", "Boudouaou", "Dellys", "Draâ Ben Khedda", "Khemis El Khechna", "Lakhdaria", "Médéa", "Sour El Ghozlane",
    "Tizi Gheniff", "Tizi Rached", "Béni Amrane", "Boghni", "Bouzegza", "Chabet el Ameur", "Djemaa Saharidj",
    "Draâ El Mizan", "Fréha", "Illilten", "Larbi Ben M'hidi", "Mechtras", "Mekla", "Ouadhia", "Souk El Thenine",
    "Tadmaït", "Tirmitine", "Yakouren", "Aïn El Hammam", "Azazga", "Beni Yenni", "Bouzeguène", "Chemini",
    "Iboudraren", "Iferhounène", "M'Chedallah", "Maâtkas", "Michelet", "Sidi Aïch", "Takerboust",
    "Timezrit", "Tizi N'Tlata", "Tizi Ouzou", "Aïn Arnat", "Aïn Azel", "Aït Naoual", "Beni Aziz", "Bir el Arch",
    "Bouandas", "Bougaa", "Boutaleb", "Djemila", "El Ouricia", "Guenzet", "Guidjel", "Hammam Guergour",
    "Hammam Soukhna", "Maoklane", "Rosfa", "Salah Bey", "Sétif", "Sétif", "Taya"
  ],
  AD: ["Andorra la Vella", "Escaldes-Engordany", "Encamp", "Sant Julià de Lòria", "La Massana", "Ordino", "Canillo", "El Serrat", "Pas de la Casa", "Arinsal"],
  AO: [
    "Luanda", "Huambo", "Lobito", "Benguela", "Cuito", "Lubango", "Malanje", "Namibe", "Soyo", "Cabinda",
    "Uíge", "M'banza-Kongo", "Sumbe", "Ndalatando", "Caála", "Menongue", "Luena", "Lucapa", "Dundo", "Nzeto",
    "Calandula", "Ambriz", "Andulo", "Bailundo", "Balombo", "Bibala", "Bocoio", "Caconda", "Cacuso", "Camacupa"
  ],
  AG: ["St. John's", "All Saints", "Liberta", "Potters Village", "Bolans", "Swetes", "Freetown", "Parham", "Codrington", "Jennings", "Old Road", "Willikies", "Cedar Grove", "Urlings"],
  AR: [
    "Buenos Aires", "Córdoba", "Rosario", "Mendoza", "La Plata", "San Miguel de Tucumán", "Mar del Plata", "Salta", "Santa Fe", "San Juan",
    "Resistencia", "Santiago del Estero", "Corrientes", "Posadas", "San Salvador de Jujuy", "Bahía Blanca", "Paraná", "Neuquén", "Formosa", "San Luis",
    "La Rioja", "Río Cuarto", "Concordia", "Comodoro Rivadavia", "San Rafael", "Villa María", "Villa Mercedes", "Goya", "Mercedes",
    "Azul", "Tandil", "Olavarría", "Pergamino", "Venado Tuerto", "Junín", "Río Gallegos", "Ushuaia", "Viedma", "Rawson",
    "Santa Rosa", "San Francisco", "Rafaela", "Río Grande", "Caleta Olivia", "General Roca", "Cipolletti", "Zárate", "Campana", "Necochea"
  ],
  AM: [
    "Yerevan", "Gyumri", "Vanadzor", "Vagharshapat", "Hrazdan", "Abovyan", "Kapan", "Armavir", "Gavar", "Artashat",
    "Ararat", "Dilijan", "Goris", "Ashtarak", "Sevan", "Masis", "Charentsavan", "Sisian", "Stepanavan", "Spitak",
    "Ijevan", "Yeghvard", "Metsamor", "Vardenis", "Talin", "Maralik", "Noyemberyan", "Tashir", "Aparan", "Meghri"
  ],
  AU: [
    "Sydney", "Melbourne", "Brisbane", "Perth", "Adelaide", "Gold Coast", "Canberra", "Newcastle", "Wollongong", "Hobart",
    "Geelong", "Townsville", "Cairns", "Darwin", "Toowoomba", "Ballarat", "Bendigo", "Mackay", "Launceston", "Rockhampton",
    "Bunbury", "Coffs Harbour", "Hervey Bay", "Shepparton", "Gladstone", "Mildura", "Warrnambool", "Port Macquarie", "Bathurst", "Tamworth",
    "Albury", "Mount Gambier", "Kalgoorlie", "Devonport", "Lismore", "Albany", "Geraldton", "Dubbo", "Orange", "Nowra",
    "Goulburn", "Armidale", "Griffith", "Broken Hill", "Whyalla", "Victor Harbor", "Gawler", "Cessnock", "Taree", "Wagga Wagga"
  ],
  AT: [
    "Vienna", "Graz", "Linz", "Salzburg", "Innsbruck", "Klagenfurt", "Villach", "Wels", "Sankt Pölten", "Dornbirn",
    "Steyr", "Bregenz", "Leoben", "Kapfenberg", "Hallein", "Kufstein", "Traun", "Amstetten", "Lustenau", "Baden",
    "Mödling", "Eisenstadt", "Neunkirchen", "Mistelbach", "Tulln", "Krems", "Stockerau", "Saalfelden", "Judenburg", "Zell am See"
  ],
  AZ: [
    "Baku", "Ganja", "Sumqayit", "Mingachevir", "Lankaran", "Shirvan", "Nakhchivan", "Shaki", "Yevlakh", "Khachmaz",
    "Salyan", "Barda", "Masalli", "Jalilabad", "Goychay", "Agjabadi", "Imishli", "Hajigabul", "Zaqatala",
    "Sabirabad", "Astara", "Gadabay", "Qazakh", "Tovuz", "Goranboy", "Gabala", "Shamakhi", "Ismayilli", "Balakan"
  ],
  BS: ["Nassau", "Freeport", "West End", "Marsh Harbour", "George Town", "Andros Town", "Clarence Town", "Alice Town", "Spanish Wells", "Rock Sound", "Governor's Harbour", "Dunmore Town", "Matthew Town"],
  BH: ["Manama", "Riffa", "Muharraq", "Hamad Town", "A'ali", "Isa Town", "Sitra", "Budaiya", "Jidhafs", "Sanabis", "Tubli", "Saar", "Durrat Al Bahrain", "Amwaj"],
  BD: [
    "Dhaka", "Chittagong", "Khulna", "Rajshahi", "Sylhet", "Barisal", "Rangpur", "Mymensingh", "Comilla", "Narayanganj",
    "Gazipur", "Jessore", "Bogra", "Dinajpur", "Pabna", "Tangail", "Faridpur", "Kushtia", "Cox's Bazar",
    "Brahmanbaria", "Jamalpur", "Noakhali", "Satkhira", "Habiganj", "Sunamganj", "Chandpur", "Narsingdi", "Feni", "Madaripur"
  ],
  BB: ["Bridgetown", "Speightstown", "Oistins", "Holetown", "Worthing", "Hastings", "Black Rock", "Bathsheba", "Christ Church", "Saint James", "Saint Lucy"],
  BY: [
    "Minsk", "Gomel", "Mogilev", "Vitebsk", "Grodno", "Brest", "Babruysk", "Baranovichi", "Borisov", "Pinsk",
    "Orsha", "Mozyr", "Novopolotsk", "Lida", "Soligorsk", "Molodechno", "Polotsk", "Zhlobin", "Rechitsa", "Svetlogorsk",
    "Kobrin", "Slutsk", "Zhodino", "Osipovichi", "Rogachev", "Dzerzhinsk", "Luninets", "Slonim", "Gorki", "Berezino"
  ],
  BE: [
    "Brussels", "Antwerp", "Ghent", "Charleroi", "Liège", "Bruges", "Namur", "Leuven", "Mons", "Mechelen",
    "Aalst", "Hasselt", "Kortrijk", "Ostend", "Tournai", "Genk", "Sint-Niklaas", "Roeselare", "Verviers", "Wavre",
    "Turnhout", "Arlon", "Dinant", "Huy", "Seraing", "Lokeren", "Tienen", "Waterloo", "Eupen", "Malmedy"
  ],
  BZ: ["Belize City", "San Ignacio", "Belmopan", "Orange Walk", "Corozal Town", "Dangriga", "Punta Gorda", "Benque Viejo", "Placencia", "San Pedro"],
  BJ: [
    "Cotonou", "Porto-Novo", "Parakou", "Abomey", "Bohicon", "Djougou", "Lokossa", "Ouidah", "Natitingou", "Savalou",
    "Kandi", "Pobè", "Kétou", "Sakété", "Malanville", "Tanguiéta", "Cobly", "Comè", "Bembèrèkè", "Nikki"
  ],
  BT: ["Thimphu", "Phuntsholing", "Paro", "Punakha", "Wangdue Phodrang", "Bumthang", "Trashigang", "Mongar", "Gelephu", "Samdrup Jongkhar", "Trongsa", "Haa", "Lhuntse"],
  BO: [
    "Santa Cruz", "La Paz", "Cochabamba", "Sucre", "Oruro", "Tarija", "Potosí", "El Alto", "Trinidad", "Cobija",
    "Sacaba", "Quillacollo", "Montero", "Camiri", "Villazón", "Yacuíba", "Riberalta", "Guayaramerín", "Punata", "Llallagua"
  ],
  BA: [
    "Sarajevo", "Banja Luka", "Tuzla", "Zenica", "Mostar", "Bijeljina", "Brčko", "Prijedor", "Trebinje", "Doboj",
    "Cazin", "Bihać", "Zvornik", "Gradiška", "Gradačac", "Široki Brijeg", "Livno", "Tomislavgrad", "Goražde", "Foča"
  ],
  BW: [
    "Gaborone", "Francistown", "Molepolole", "Serowe", "Maun", "Kanye", "Mochudi", "Kasane", "Lobatse", "Tlokweng",
    "Palapye", "Mogoditshane", "Letlhakane", "Selebi-Phikwe", "Mahalapye", "Jwaneng", "Ghanzi", "Nata", "Shakawe", "Tonota"
  ],
  BR: [
    "São Paulo", "Rio de Janeiro", "Brasília", "Salvador", "Fortaleza", "Belo Horizonte", "Manaus", "Curitiba", "Recife", "Porto Alegre",
    "Belém", "Goiânia", "Guarulhos", "Campinas", "São Luís", "Maceió", "Campo Grande", "Natal", "Teresina", "João Pessoa",
    "Ribeirão Preto", "Uberlândia", "Sorocaba", "Cuiabá", "Aracaju", "Florianópolis", "Londrina", "Porto Velho",
    "Caxias do Sul", "Juiz de Fora", "Niterói", "Boa Vista", "Macapá", "Feira de Santana", "São José dos Campos", "Maringá", "Piracicaba",
    "Joinville", "Blumenau", "Chapecó", "Criciúma", "Itajaí", "Pelotas", "Rio Grande", "Santa Maria", "Canoas", "Novo Hamburgo"
  ],
  BN: ["Bandar Seri Begawan", "Kuala Belait", "Seria", "Tutong", "Bangar", "Muara", "Labi", "Bukit Sawat", "Sukang", "Melilas"],
  BG: [
    "Sofia", "Plovdiv", "Varna", "Burgas", "Ruse", "Stara Zagora", "Pleven", "Sliven", "Dobrich", "Shumen",
    "Pernik", "Veliko Tarnovo", "Blagoevgrad", "Razgrad", "Pazardzhik", "Gabrovo", "Vratsa", "Kardzhali", "Kyustendil", "Montana",
    "Lovech", "Yambol", "Silistra", "Vidin", "Smolyan", "Haskovo", "Dimitrovgrad", "Kazanlak", "Karlovo", "Svishtov"
  ],
  BF: [
    "Ouagadougou", "Bobo-Dioulasso", "Koudougou", "Ouahigouya", "Banfora", "Dédougou", "Kaya", "Tenkodogo", "Fada N'Gourma", "Dori",
    "Réo", "Gaoua", "Manga", "Ziniaré", "Boulsa", "Yako", "Gourcy", "Bogandé", "Tougan", "Nouna"
  ],
  BI: [
    "Bujumbura", "Gitega", "Ngozi", "Ruyigi", "Bururi", "Makamba", "Kayanza", "Kirundo", "Rutana", "Muramvya",
    "Cankuzo", "Muyinga", "Karuzi", "Bubanza", "Rumonge", "Isale", "Kabezi", "Mutambu", "Mubimbi", "Bugarama"
  ],
  CV: [
    "Praia", "Mindelo", "Santa Maria", "São Filipe", "Assomada", "Espargos", "Porto Novo", "Ribeira Brava", "Sal Rei", "Mosteiros",
    "Calheta", "Tarrafal", "Vila do Maio", "Cidade Velha", "Pedra Badejo", "São Domingos", "Picos", "Achada Baleia", "Palma", "Ponta do Sol"
  ],
  KH: [
    "Phnom Penh", "Siem Reap", "Battambang", "Sihanoukville", "Kampong Cham", "Kampong Chhnang", "Kampong Speu", "Kampot", "Kandal", "Kratie",
    "Pailin", "Prey Veng", "Pursat", "Ratanakiri", "Stung Treng", "Svay Rieng", "Takeo", "Koh Kong", "Kep", "Mondulkiri"
  ],
  CM: [
    "Douala", "Yaoundé", "Garoua", "Bamenda", "Maroua", "Bafoussam", "Nkongsamba", "Ngaoundéré", "Bertoua", "Ebolowa",
    "Kumba", "Buea", "Limbe", "Edéa", "Foumban", "Mokolo", "Bafang", "Dschang", "Sangmélima", "Kribi",
    "Batouri", "Mbalmayo", "Guider", "Mbouda", "Yagoua", "Tiko", "Mamfe", "Obala", "Eséka", "Abong-Mbang"
  ],
  CA: [
    "Toronto", "Montreal", "Vancouver", "Calgary", "Edmonton", "Ottawa", "Winnipeg", "Quebec City", "Hamilton", "Kitchener",
    "London", "Halifax", "Victoria", "Windsor", "Saskatoon", "Regina", "Mississauga", "Brampton", "Surrey", "Laval",
    "Longueuil", "Gatineau", "Burnaby", "Richmond", "Markham", "Oakville", "Burlington", "Abbotsford", "Sudbury", "St. John's",
    "Barrie", "Kelowna", "Sherbrooke", "Trois-Rivières", "Thunder Bay", "Moncton", "Guelph", "Saint John", "Kingston", "Peterborough",
    "Granby", "Drummondville", "Mirabel", "Blainville", "Repentigny", "Terrebonne", "Brossard", "Rimouski", "Saguenay", "Alma"
  ],
  CF: [
    "Bangui", "Bimbo", "Berbérati", "Bouar", "Bambari", "Bossangoa", "Kaga-Bandoro", "Paoua", "Nola", "Bozoum",
    "Bria", "Batangafo", "Alindao", "Kouango", "Mobaye", "Ippy", "Bangassou", "Zemio", "Obo", "Rafaï"
  ],
  TD: [
    "N'Djamena", "Moundou", "Sarh", "Abeche", "Am Timan", "Doba", "Mongo", "Koumra", "Bongor", "Pala",
    "Mao", "Lai", "Biltine", "Adré", "Ati", "Oum Hadjer", "Massakory", "Goz Beïda", "Faya-Largeau", "Massaguet"
  ],
  CL: [
    "Santiago", "Valparaíso", "Concepción", "La Serena", "Antofagasta", "Temuco", "Rancagua", "Iquique", "Talca", "Arica",
    "Puerto Montt", "Chillán", "Copiapó", "Osorno", "Los Ángeles", "Calama", "Viña del Mar", "Talcahuano", "Coquimbo",
    "Punta Arenas", "Curicó", "Coyhaique", "Linares", "Valdivia", "San Fernando", "San Antonio", "La Ligua", "Villa Alemana", "Rengo"
  ],
  CN: [
    "Shanghai", "Beijing", "Guangzhou", "Shenzhen", "Chengdu", "Nanjing", "Wuhan", "Hangzhou", "Chongqing", "Tianjin",
    "Shenyang", "Ningbo", "Suzhou", "Xi'an", "Qingdao", "Dalian", "Foshan", "Zhengzhou", "Changsha", "Harbin",
    "Hefei", "Kunming", "Changchun", "Jinan", "Fuzhou", "Lanzhou", "Guiyang", "Nanning", "Wenzhou", "Zhuhai",
    "Xiamen", "Shijiazhuang", "Taiyuan", "Urumqi", "Wuxi", "Zibo", "Yantai", "Weifang", "Huizhou", "Nantong"
  ],
  CO: [
    "Bogotá", "Medellín", "Cali", "Barranquilla", "Cartagena", "Cúcuta", "Bucaramanga", "Pereira", "Santa Marta", "Ibagué",
    "Manizales", "Pasto", "Neiva", "Villavicencio", "Armenia", "Popayán", "Sincelejo", "Montería", "Valledupar", "Tunja",
    "Florencia", "Riohacha", "Yopal", "Quibdó", "Barrancabermeja", "Buga", "Girardot", "Duitama", "Sogamoso",
    "Envigado", "La Estrella", "Sabaneta", "Copacabana", "Soledad", "Malambo", "Piedecuesta", "Floridablanca", "Rionegro", "Itagüí"
  ],
  KM: [
    "Moroni", "Mutsamudu", "Fomboni", "Mitsamiouli", "Ouani", "Domoni", "Moya", "Sima", "Iconi", "Bambao",
    "Mitsoudjé", "Nioumachoua", "Mirontsi", "Kangani", "Mramani", "Daji", "Hantsindzi", "Dindri", "Koua", "Koni-Djodjo"
  ],
  CG: [
    "Brazzaville", "Pointe-Noire", "Dolisie", "Nkayi", "Ouesso", "Madingou", "Owando", "Impfondo", "Mossendjo", "Gamboma",
    "Kinkala", "Ewo", "Sibiti", "Djambala", "Loubomo", "Bétou", "Kella", "Boko", "Loudima", "Nganga Lingolo"
  ],
  CD: [
    "Kinshasa", "Lubumbashi", "Mbuji-Mayi", "Kisangani", "Bukavu", "Kananga", "Goma", "Likasi", "Kolwezi", "Boma",
    "Uvira", "Kikwit", "Mbandaka", "Matadi", "Beni", "Bunia", "Isiro", "Butembo", "Mwene-Ditu", "Tshikapa",
    "Kindu", "Kamina", "Gemena", "Bandundu", "Boende", "Lisala", "Bumba", "Kenge", "Kalemie", "Manono"
  ],
  CR: [
    "San José", "Alajuela", "Cartago", "Heredia", "Liberia", "Puntarenas", "Limón", "Quesada", "Turrialba", "Nicoya",
    "Pérez Zeledón", "Cañas", "Guápiles", "Siquirres", "Golfito", "San Isidro", "Upala", "Cóbano", "Ciudad Neily", "Tilarán"
  ],
  CI: [
    "Abidjan", "Yamoussoukro", "Bouaké", "Daloa", "Korhogo", "Gagnoa", "San-Pédro", "Man", "Divo", "Abengourou",
    "Soubré", "Odienné", "Bondoukou", "Séguéla", "Ferkessédougou", "Touba", "Boundiali", "Agboville", "Dabou", "Grand-Bassam"
  ],
  HR: [
    "Zagreb", "Split", "Rijeka", "Osijek", "Zadar", "Slavonski Brod", "Pula", "Dubrovnik", "Karlovac", "Varaždin",
    "Šibenik", "Sisak", "Velika Gorica", "Vinkovci", "Koprivnica", "Čakovec", "Đakovo", "Vukovar", "Bjelovar",
    "Makarska", "Trogir", "Rovinj", "Zaprešić", "Petrinja", "Metković", "Omiš", "Poreč", "Vodice", "Imotski"
  ],
  CU: [
    "Havana", "Santiago de Cuba", "Camagüey", "Holguín", "Santa Clara", "Guantánamo", "Bayamo", "Pinar del Río", "Cienfuegos", "Matanzas",
    "Las Tunas", "Ciego de Ávila", "Artemisa", "Manzanillo", "Palma Soriano", "Colón", "Nueva Gerona", "Morón", "San José de las Lajas", "San Luis"
  ],
  CY: [
    "Nicosia", "Limassol", "Larnaca", "Paphos", "Famagusta", "Kyrenia", "Morphou", "Paralimni", "Aradippou", "Dhali",
    "Lefka", "Polis", "Peyia", "Geroskipou", "Ypsonas", "Kiti", "Dromolaxia", "Livadia", "Sotira", "Avgorou"
  ],
  CZ: [
    "Prague", "Brno", "Ostrava", "Plzeň", "Liberec", "Olomouc", "České Budějovice", "Hradec Králové", "Ústí nad Labem", "Pardubice",
    "Zlín", "Havířov", "Kladno", "Karviná", "Opava", "Frýdek-Místek", "Karlovy Vary", "Jihlava", "Teplice", "Děčín",
    "Litoměřice", "Beroun", "Jablonec nad Nisou", "Trutnov", "Tábor", "Český Krumlov", "Kolín", "Kutná Hora", "Hodonín", "Blansko"
  ],
  DK: [
    "Copenhagen", "Aarhus", "Odense", "Aalborg", "Esbjerg", "Randers", "Kolding", "Horsens", "Vejle", "Roskilde",
    "Herning", "Silkeborg", "Fredericia", "Helsingør", "Viborg", "Holstebro", "Slagelse", "Hillerød", "Næstved", "Hjørring",
    "Sønderborg", "Frederikshavn", "Haderslev", "Ringsted", "Skive", "Nykøbing Falster", "Nyborg", "Køge", "Kalundborg", "Billund"
  ],
  DJ: [
    "Djibouti City", "Ali Sabieh", "Tadjoura", "Obock", "Dikhil", "Arta", "Balbala", "Yoboki", "Randa", "Khor Angar",
    "Holhol", "Ali Adde", "As Eyla", "Goubetti", "Goda"
  ],
  DM: ["Roseau", "Portsmouth", "Marigot", "Berekua", "Saint Joseph", "Wesley", "Salisbury", "Castle Bruce", "Calibishie", "La Plaine"],
  DO: [
    "Santo Domingo", "Santiago de los Caballeros", "La Vega", "San Pedro de Macorís", "San Cristóbal", "Puerto Plata", "Higüey", "San Francisco de Macorís", "Bonao", "Baní",
    "Moca", "Azua", "Mao", "Boca Chica", "Hato Mayor", "Cotuí", "Nagua", "Salcedo", "Jarabacoa", "Constanza",
    "Samaná", "Sosúa", "La Romana", "Las Terrenas", "San Juan de la Maguana", "Dajabón", "Monte Plata", "Cabrera", "Río San Juan", "Michele"
  ],
  EC: [
    "Quito", "Guayaquil", "Cuenca", "Santo Domingo", "Machala", "Manta", "Portoviejo", "Ambato", "Loja", "Riobamba",
    "Quevedo", "Babahoyo", "Ibarra", "Esmeraldas", "Latacunga", "Tulcán", "Santa Elena", "Tena", "Puyo", "Macas",
    "Zamora", "Nueva Loja", "Chone", "Cayambe", "Otavalo", "Salinas", "Jipijapa", "Daule", "La Libertad", "Bahía de Caráquez"
  ],
  EG: [
    "Cairo", "Alexandria", "Giza", "Shubra El Kheima", "Port Said", "Suez", "Luxor", "Mansoura", "Tanta", "Asyut",
    "Ismailia", "Fayyum", "Zagazig", "Damietta", "Aswan", "Minya", "Beni Suef", "Sohag", "Hurghada", "Qena",
    "Banha", "Kafr el-Sheikh", "Arish", "Mallawi", "10th of Ramadan City", "Marsa Matruh", "Desouk", "Damanhur", "Sharm El Sheikh", "El Gouna",
    "Safaga", "Idfu", "Kom Ombo", "Armant", "Esna", "Samalut", "Maghagha", "Tahta", "Akhmim", "Girga"
  ],
  SV: [
    "San Salvador", "Santa Ana", "Soyapango", "San Miguel", "Mejicanos", "Apopa", "Delgado", "Ahuachapán", "Usulután", "Ilopango",
    "Cojutepeque", "Zacatecoluca", "Chalchuapa", "San Vicente", "Sensuntepeque", "La Unión", "Sonsonate", "Santa Tecla", "Antiguo Cuscatlán", "Nuevo Cuscatlán"
  ],
  GQ: [
    "Malabo", "Bata", "Ebebiyín", "Evinayong", "Aconibe", "Añisok", "Mongomo", "Mikomeseng", "Nsok", "San Antonio de Palé",
    "Luba", "Riaba", "Mbini", "Ncue", "Ayene", "Bidjabidjan", "Mengomeyén", "Nsang", "Mvomeka'a", "Nsok-Nsomo"
  ],
  ER: [
    "Asmara", "Keren", "Massawa", "Assab", "Mendefera", "Barentu", "Teseney", "Agordat", "Nakfa", "Ghinda",
    "Dekemhare", "Adi Quala", "Senafe", "Adi Keyh", "Segheneyti", "Are'ay", "Kerkebet", "Tsorena", "Mai-Mne", "Akordat"
  ],
  EE: [
    "Tallinn", "Tartu", "Narva", "Pärnu", "Kohtla-Järve", "Viljandi", "Maardu", "Rakvere", "Sillamäe", "Kuressaare",
    "Võru", "Jõhvi", "Haapsalu", "Paide", "Keila", "Kiviõli", "Põlva", "Türi", "Elva", "Rapla"
  ],
  SZ: ["Mbabane", "Manzini", "Lobamba", "Siteki", "Nhlangano", "Hlatikulu", "Piggs Peak", "Mhlume", "Big Bend", "Malkerns", "Bhunya", "Hluti", "Mpaka", "Matsapha"],
  ET: [
    "Addis Ababa", "Dire Dawa", "Mek'ele", "Gondar", "Bahir Dar", "Awassa", "Harar", "Jimma", "Nazret", "Dessie",
    "Jijiga", "Shashamane", "Bishoftu", "Arba Minch", "Mojo", "Kombolcha", "Adama", "Gambela", "Asosa", "Robe"
  ],
  FJ: [
    "Suva", "Nadi", "Lautoka", "Labasa", "Ba", "Sigatoka", "Savusavu", "Levuka", "Tavua", "Rakiraki",
    "Navua", "Nausori", "Lami", "Korovou", "Vunisea", "Kadavu", "Matei", "Lakeba", "Rotuma", "Mba"
  ],
  FI: [
    "Helsinki", "Espoo", "Tampere", "Vantaa", "Oulu", "Turku", "Jyväskylä", "Lahti", "Kuopio", "Pori",
    "Joensuu", "Lappeenranta", "Vaasa", "Rovaniemi", "Seinäjoki", "Kotka", "Mikkeli", "Hämeenlinna", "Kokkola", "Kajaani",
    "Imatra", "Riihimäki", "Salo", "Savonlinna", "Kuusamo", "Tornio", "Kemi", "Iisalmi", "Varkaus", "Nurmijärvi"
  ],
  FR: [
    "Paris", "Marseille", "Lyon", "Toulouse", "Nice", "Nantes", "Strasbourg", "Montpellier", "Bordeaux", "Lille",
    "Rennes", "Reims", "Saint-Étienne", "Le Havre", "Dijon", "Grenoble", "Angers", "Villeurbanne", "Nîmes", "Clermont-Ferrand",
    "Le Mans", "Aix-en-Provence", "Brest", "Tours", "Amiens", "Limoges", "Metz", "Perpignan", "Besançon", "Orléans",
    "Rouen", "Mulhouse", "Nancy", "Avignon", "Poitiers", "Pau", "Calais", "Cannes", "Colmar", "Saint-Malo",
    "Béziers", "Bourg-en-Bresse", "Chartres", "Douai", "Dunkerque", "Laval", "Lorient", "Maçon", "Quimper", "Troyes",
    "Valence", "Vannes", "Versailles", "Auxerre", "Aubagne", "Martigues", "Salon-de-Provence", "Vitrolles", "Draguignan", "Gap",
    "Versailles", "Saint-Germain-en-Laye", "Montreuil", "Argenteuil", "Saint-Denis", "Boulogne-Billancourt", "Courbevoie",
    "Nanterre", "Créteil", "Vitry-sur-Seine", "Vincennes", "Neuilly-sur-Seine", "Levallois-Perret", "Issy-les-Moulineaux",
    "Meudon", "Puteaux", "Sèvres", "Saint-Cloud", "Boulogne-sur-Mer", "Lens", "Liévin", "Arras", "Béthune",
    "Hazebrouck", "Cambrai", "Valenciennes", "Maubeuge", "Douai", "Avesnes-sur-Helpe", "Lille", "Roubaix", "Tourcoing",
    "Dunkerque", "Gravelines", "Bourbourg", "Saint-Omer", "Calais", "Boulogne-sur-Mer", "Montreuil-sur-Mer",
    "Étaples", "Le Touquet", "Berck", "Abbeville", "Amiens", "Péronne", "Saint-Quentin", "Laon", "Soissons",
    "Compiègne", "Château-Thierry", "Meaux", "Fontainebleau", "Melun", "Provins", "Sens", "Auxerre", "Tonnerre",
    "Avallon", "Vézelay", "Clamecy", "Nevers", "Moulins", "Vichy", "Montluçon", "Riom", "Issoire", "Ambert",
    "Le Puy-en-Velay", "Yssingeaux", "Brioude", "Saint-Flour", "Aurillac", "Figeac", "Cahors", "Gourdon", "Sarlat",
    "Périgueux", "Bergerac", "Libourne", "Arcachon", "Bayonne", "Biarritz", "Saint-Jean-de-Luz", "Hendaye",
    "Dax", "Mont-de-Marsan", "Pau", "Lourdes", "Tarbes", "Bagnères-de-Bigorre", "Saint-Gaudens", "Foix",
    "Pamiers", "Carcassonne", "Narbonne", "Castres", "Albi", "Millau", "Rodez", "Mende", "Marvejols", "Florac",
    "Alès", "Nîmes", "Uzès", "Bagnols-sur-Cèze", "Orange", "Carpentras", "Apt", "Cavaillon", "Salon-de-Provence",
    "Arles", "Tarascon", "Saint-Rémy-de-Provence", "Aix-en-Provence", "Marseille", "Martigues", "Istres",
    "Miramas", "La Ciotat", "Toulon", "Hyères", "Draguignan", "Fréjus", "Saint-Raphaël", "Cannes", "Antibes",
    "Grasse", "Vence", "Nice", "Monaco", "Menton", "Bastia", "Calvi", "L'Île-Rousse", "Porto-Vecchio",
    "Ajaccio", "Propriano", "Sartène", "Saint-Denis (Réunion)", "Saint-Paul", "Saint-Pierre", "Le Tampon",
    "Fort-de-France", "Pointe-à-Pitre", "Basse-Terre", "Cayenne", "Saint-Laurent-du-Maroni", "Kourou",
    "Mamoudzou", "Dzaoudzi", "Nouméa", "Papeete", "Saint-Paul"
  ],
  GA: [
    "Libreville", "Port-Gentil", "Franceville", "Owendo", "Moanda", "Lambaréné", "Tchibanga", "Koulamoutou", "Makokou", "Bitam",
    "Mouila", "Ntoum", "Lébamba", "Ndendé", "Fougamou", "Gamba", "Omboué", "Mbigou", "Mounana", "Lastoursville"
  ],
  GM: [
    "Banjul", "Serekunda", "Brikama", "Bakau", "Farafenni", "Mansa Konko", "Basse Santa Su", "Kuntaur", "Janjanbureh", "Kerewan",
    "Soma", "Bansang", "Gunjur", "Kotu", "Lamin", "Sukuta", "Wellingara", "Yundum", "Bundung", "Brifu"
  ],
  GE: [
    "Tbilisi", "Batumi", "Kutaisi", "Rustavi", "Gori", "Zugdidi", "Poti", "Telavi", "Samtredia", "Senaki",
    "Tskhinvali", "Kobuleti", "Ozurgeti", "Gardabani", "Bolnisi", "Chiatura", "Akhaltsikhe", "Tsqaltubo", "Khashuri", "Sukhumi"
  ],
  DE: [
    "Berlin", "Hamburg", "Munich", "Cologne", "Frankfurt", "Stuttgart", "Düsseldorf", "Leipzig", "Dortmund", "Essen",
    "Bremen", "Dresden", "Hanover", "Nuremberg", "Duisburg", "Bochum", "Bonn", "Mannheim", "Bielefeld", "Karlsruhe",
    "Wiesbaden", "Münster", "Aachen", "Augsburg", "Krefeld", "Kiel", "Magdeburg", "Halle", "Freiburg", "Rostock",
    "Mainz", "Lübeck", "Kassel", "Potsdam", "Darmstadt", "Erfurt", "Oberhausen", "Ludwigshafen", "Saarbrücken", "Ulm",
    "Würzburg", "Heidelberg", "Regensburg", "Göttingen", "Oldenburg", "Osnabrück", "Trier", "Celle", "Lüneburg", "Flensburg"
  ],
  GH: [
    "Accra", "Kumasi", "Tamale", "Sekondi-Takoradi", "Ashaiman", "Tema", "Koforidua", "Cape Coast", "Wa", "Ho",
    "Sunyani", "Bolgatanga", "Bawku", "Nkawkaw", "Obuasi", "Winneba", "Kasoa", "Mampong", "Konongo",
    "Tarkwa", "Prestea", "Akosombo", "Nsawam", "Kade", "Oda", "Akim Swedru", "Begoro", "Keta", "Hohoe"
  ],
  GR: [
    "Athens", "Thessaloniki", "Patras", "Heraklion", "Larissa", "Volos", "Ioannina", "Kavala", "Chania", "Rhodes",
    "Kalamata", "Veria", "Katerini", "Alexandroupoli", "Tripoli", "Serres", "Lamia", "Kozani", "Komotini", "Mytilene",
    "Sparta", "Chalkida", "Karditsa", "Corinth", "Piraeus", "Kerkyra", "Rethymno", "Drama", "Xanthi", "Kastoria"
  ],
  GD: ["St. George's", "Grenville", "Gouyave", "Victoria", "Sauteurs", "Hillsborough", "Saint David's", "Tivoli", "Windsor", "Dunfermline"],
  GT: [
    "Guatemala City", "Mixco", "Villa Nueva", "Quetzaltenango", "Escuintla", "Chimaltenango", "Mazatenango", "Antigua Guatemala", "Huehuetenango", "Cobán",
    "Jalapa", "Totonicapán", "Chichicastenango", "Sololá", "Retalhuleu", "Santa Cruz del Quiché", "Zacapa", "Puerto Barrios", "Chiquimula", "San Marcos"
  ],
  GN: [
    "Conakry", "N'Zérékoré", "Kankan", "Kindia", "Labé", "Boké", "Fria", "Mamou", "Kamsar", "Siguiri",
    "Télimélé", "Kissidougou", "Macenta", "Dabola", "Pita", "Dalaba", "Tougué", "Gaoual", "Koundara", "Forécariah"
  ],
  GW: [
    "Bissau", "Bafatá", "Gabú", "Cacheu", "Bolama", "Quinhamel", "Mansoa", "Buba", "Catió", "Farim",
    "Bissorã", "Bubaque", "São Domingos", "Ingoré", "Nhacra", "Prabis", "Safim", "Tite", "Cumeré", "Canghungo"
  ],
  GY: [
    "Georgetown", "Linden", "New Amsterdam", "Anna Regina", "Bartica", "Lethem", "Mabaruma", "Paradise", "Ituni", "Rose Hall",
    "Mahaicony", "Rosignol", "Skeldon", "Fort Wellington", "Vreed-en-Hoop", "La Grange", "Uitvlugt", "Cornelia Ida", "Best", "Mahaica"
  ],
  HT: [
    "Port-au-Prince", "Cap-Haïtien", "Jacmel", "Gonaïves", "Saint-Marc", "Les Cayes", "Port-de-Paix", "Jérémie", "Miragoâne", "Fort-Liberté",
    "Hinche", "Pétion-Ville", "Delmas", "Carrefour", "Tabarre", "Thomazeau", "Aquin", "Dame-Marie", "Anse d'Hainault", "Coteaux"
  ],
  HN: [
    "Tegucigalpa", "San Pedro Sula", "Choloma", "La Ceiba", "El Progreso", "Danlí", "Juticalpa", "Siguatepeque", "Villanueva", "Catacamas",
    "Puerto Cortés", "Comayagua", "Santa Rosa de Copán", "Olanchito", "Yoro", "La Paz", "Santa Bárbara", "Choluteca", "Trujillo", "Roatán"
  ],
  HU: [
    "Budapest", "Debrecen", "Szeged", "Miskolc", "Pécs", "Győr", "Nyíregyháza", "Kecskemét", "Székesfehérvár", "Szombathely",
    "Szolnok", "Tatabánya", "Kaposvár", "Érd", "Veszprém", "Békéscsaba", "Zalaegerszeg", "Sopron", "Eger", "Nagykanizsa",
    "Dunaújváros", "Hódmezővásárhely", "Salgótarján", "Baja", "Mosonmagyaróvár", "Gyöngyös", "Hajdúszoboszló", "Ózd", "Kazincbarcika", "Gödöllő"
  ],
  IS: [
    "Reykjavík", "Kópavogur", "Hafnarfjörður", "Akureyri", "Garðabær", "Mosfellsbær", "Reykjanesbær", "Akranes", "Selfoss", "Vestmannaeyjar",
    "Grindavík", "Hveragerði", "Egilsstaðir", "Höfn", "Dalvík", "Siglufjörður", "Keflavík", "Njarðvík", "Sandgerði", "Þorlákshöfn"
  ],
  IN: [
    "Mumbai", "Delhi", "Bengaluru", "Hyderabad", "Ahmedabad", "Chennai", "Kolkata", "Surat", "Pune", "Jaipur",
    "Lucknow", "Kanpur", "Nagpur", "Indore", "Thane", "Bhopal", "Visakhapatnam", "Patna", "Vadodara", "Ghaziabad",
    "Ludhiana", "Agra", "Nashik", "Faridabad", "Meerut", "Rajkot", "Varanasi", "Srinagar", "Aurangabad", "Dhanbad",
    "Amritsar", "Allahabad", "Ranchi", "Coimbatore", "Jabalpur", "Gwalior", "Vijayawada", "Jodhpur", "Madurai", "Raipur"
  ],
  ID: [
    "Jakarta", "Surabaya", "Bandung", "Medan", "Semarang", "Makassar", "Palembang", "Tangerang", "Depok", "Bekasi",
    "Surakarta", "Denpasar", "Bogor", "Manado", "Malang", "Yogyakarta", "Pekanbaru", "Banjarmasin", "Padang", "Samarinda",
    "Pontianak", "Batam", "Balikpapan", "Jambi", "Mataram", "Kupang", "Ambon", "Kendari", "Palu", "Gorontalo"
  ],
  IR: [
    "Tehran", "Mashhad", "Isfahan", "Karaj", "Tabriz", "Shiraz", "Qom", "Ahvaz", "Kermanshah", "Urmia",
    "Rasht", "Zahedan", "Hamadan", "Kerman", "Yazd", "Ardabil", "Bandar Abbas", "Arak", "Sari", "Qazvin",
    "Sanandaj", "Birjand", "Khorramabad", "Bushehr", "Shahr-e Kord", "Bojnord", "Semnan", "Yasuj", "Mianeh", "Gorgan"
  ],
  IQ: [
    "Baghdad", "Basra", "Mosul", "Erbil", "Kirkuk", "Najaf", "Karbala", "Sulaymaniyah", "Nasiriyah", "Amara",
    "Fallujah", "Ramadi", "Duhok", "Hillah", "Kut", "Samarra", "Tikrit", "Diwaniyah", "Zakho", "Ba'qubah",
    "Sinjar", "Tal Afar", "Haditha", "Balad", "Taji", "Kufa", "Samawah", "Shaqlawa", "Ranya", "Koysinjaq"
  ],
  IE: [
    "Dublin", "Cork", "Limerick", "Galway", "Waterford", "Drogheda", "Kilkenny", "Dundalk", "Bray", "Tralee",
    "Swords", "Navan", "Naas", "Sligo", "Ennis", "Mullingar", "Carlow", "Wexford", "Monaghan", "Athlone",
    "Letterkenny", "Clonmel", "Portlaoise", "Castlebar", "Tullamore", "Ballina", "Arklow", "Greystones", "Wicklow", "Gorey"
  ],
  IL: [],
  IT: [
    "Rome", "Milan", "Naples", "Turin", "Palermo", "Genoa", "Bologna", "Florence", "Catania", "Bari",
    "Venice", "Verona", "Messina", "Padua", "Trieste", "Taranto", "Brescia", "Parma", "Prato", "Modena",
    "Reggio Calabria", "Perugia", "Livorno", "Ravenna", "Cagliari", "Foggia", "Rimini", "Salerno", "Ferrara", "Sassari",
    "Trento", "Ancona", "Lecce", "Bergamo", "Bolzano", "Piacenza", "Udine", "Lucca", "Arezzo", "Pisa",
    "Matera", "Potenza", "Catanzaro", "Lamezia Terme", "Cosenza", "Crotone", "Trapani", "Agrigento", "Siracusa",
    "Siena", "Vicenza", "Treviso", "Belluno", "Pordenone", "Aosta", "Campobasso", "Vibo Valentia", "Ragusa", "Nuoro"
  ],
  JM: [
    "Kingston", "Portmore", "Spanish Town", "Montego Bay", "Mandeville", "May Pen", "Old Harbour", "Savanna-la-Mar", "St. Ann's Bay", "Port Antonio",
    "Black River", "Falmouth", "Lucea", "Morant Bay", "Port Maria", "Bog Walk", "Linstead", "Bull Bay", "Yallahs", "Ocho Rios"
  ],
  JP: [
    "Tokyo", "Yokohama", "Osaka", "Nagoya", "Sapporo", "Fukuoka", "Kobe", "Kyoto", "Kawasaki", "Saitama",
    "Hiroshima", "Sendai", "Chiba", "Kitakyushu", "Hamamatsu", "Niigata", "Okayama", "Kumamoto", "Kagoshima", "Kanazawa",
    "Toyota", "Nagasaki", "Gifu", "Himeji", "Matsuyama", "Takamatsu", "Toyama", "Fukuyama", "Nara", "Shizuoka",
    "Oita", "Morioka", "Akita", "Wakayama", "Aomori", "Kochi", "Tsu", "Fukui", "Tottori", "Yamagata"
  ],
  JO: [
    "Amman", "Zarqa", "Irbid", "Russeifa", "Aqaba", "Madaba", "Jerash", "Salt", "Mafraq", "Karak",
    "Tafilah", "Ajloun", "Ma'an", "Ramtha", "Wadi Musa", "Fuheis", "Sahab", "Jubeiha", "Na'ur", "Marka"
  ],
  KZ: [
    "Almaty", "Astana", "Shymkent", "Karaganda", "Aktau", "Atyrau", "Pavlodar", "Semey", "Ust-Kamenogorsk", "Taraz",
    "Kyzylorda", "Uralsk", "Kostanay", "Aktobe", "Petropavl", "Zhezkazgan", "Taldykorgan", "Kokshetau", "Turkistan", "Ekibastuz"
  ],
  KE: [
    "Nairobi", "Mombasa", "Kisumu", "Nakuru", "Eldoret", "Thika", "Malindi", "Kitale", "Nyeri", "Nanyuki",
    "Machakos", "Meru", "Garissa", "Embu", "Kakamega", "Bungoma", "Busia", "Homa Bay", "Naivasha", "Wajir",
    "Lamu", "Isiolo", "Marsabit", "Lodwar", "Moyale", "Migori", "Siaya", "Kericho", "Narok", "Kilifi"
  ],
  KI: ["Tarawa", "Bikenibeu", "Betio", "Bairiki", "Eita", "Ambo", "Buota", "Tanaea", "Buariki", "Marenau", "Bonriki", "Abaiang", "Abemama", "Butaritari", "Tabiteuea"],
  XK: [
    "Pristina", "Prizren", "Peja", "Gjakova", "Mitrovica", "Ferizaj", "Gjilan", "Vushtrri", "Suhareka", "Rahovec",
    "Malisheva", "Deçan", "Istog", "Klinë", "Skenderaj", "Viti", "Lipjan", "Obiliq", "Gracanica", "Kamenica", "Dragash"
  ],
  KW: [
    "Kuwait City", "Hawalli", "Farwaniya", "Salmiya", "Jahra", "Mangaf", "Fahaheel", "Shuwaikh", "Sabahiya", "Abdullah Port",
    "Abu Halifa", "Mahboula", "Bayan", "Mishref", "Andalus", "Surra", "Khaldiya", "Rabiya", "Shamiya", "Qadsia"
  ],
  KG: [
    "Bishkek", "Osh", "Jalal-Abad", "Karakol", "Tokmok", "Naryn", "Batken", "Kara-Balta", "Talas", "Balykchy",
    "Kemin", "Sokuluk", "Kant", "Mayluu-Suu", "Tash-Kömür", "Kyzyl-Kiya", "Sulukta", "Isfana", "Kochkor", "At-Bashy"
  ],
  LA: [
    "Vientiane", "Luang Prabang", "Pakse", "Savannakhet", "Thakhek", "Xam Neua", "Muang Xay", "Phonsavan", "Sainyabuli", "Huay Xai",
    "Salavan", "Attapeu", "Sekong", "Phongsali", "Louang Namtha", "Muang Khong", "Muang Sing", "Muang Ngeun", "Muang Pakxan", "Ban Houayxay"
  ],
  LV: [
    "Riga", "Daugavpils", "Jelgava", "Jūrmala", "Ventspils", "Liepāja", "Rēzekne", "Valmiera", "Ogre", "Tukums",
    "Cēsis", "Saldus", "Kuldīga", "Dobele", "Bauska", "Krāslava", "Ludza", "Madona", "Gulbene", "Alūksne"
  ],
  LB: [
    "Beirut", "Tripoli", "Sidon", "Tyre", "Zahlé", "Nabatieh", "Jounieh", "Baabda", "Jbeil", "Aley",
    "Bikfaya", "Zahrani", "Bcharre", "Batroun", "Amioun", "Hasbaya", "Marjayoun", "Rashaya", "Baalbek", "Hermel"
  ],
  LS: [
    "Maseru", "Teyateyaneng", "Mafeteng", "Hlotse", "Mohale's Hoek", "Maputsoe", "Butha-Buthe", "Qacha's Nek", "Quthing", "Mokhotlong",
    "Peka", "Ratau", "Ramoetsana", "Semongkong", "Naleli", "Phamong", "Mphaki", "Mount Moorosi", "Rothe", "St. Michaels"
  ],
  LR: [
    "Monrovia", "Gbarnga", "Buchanan", "Harper", "Voinjama", "Zwedru", "Greenville", "Robertsport", "Barclayville", "Bensonville",
    "Tubmanburg", "Sanniquellie", "Kakata", "Bopolu", "Fish Town", "Ganta", "Gbarpolu", "Lofa", "Bomi", "Gbarpolu"
  ],
  LY: [
    "Tripoli", "Benghazi", "Misrata", "Zawiya", "Bayda", "Tobruk", "Sirte", "Sabha", "Bani Walid", "Zliten",
    "Al Khums", "Zintan", "Derna", "Tajura", "Murzuq", "Ghat", "Ubari", "Gharyan", "Mizda", "Awjila",
    "Nalut", "Waddan", "Hun", "Brak", "Idri", "Mourzouk", "Qatrun", "Toummo", "Qarqaf", "Jufra"
  ],
  LI: ["Vaduz", "Schaan", "Balzers", "Triesen", "Eschen", "Mauren", "Triesenberg", "Ruggell", "Gamprin", "Schellenberg", "Planken", "Nendeln"],
  LT: [
    "Vilnius", "Kaunas", "Klaipėda", "Šiauliai", "Panevėžys", "Alytus", "Marijampolė", "Mažeikiai", "Jonava", "Utena",
    "Kėdainiai", "Tauragė", "Telšiai", "Biržai", "Radviliškis", "Ukmergė", "Kretinga", "Plungė", "Šilutė", "Palanga"
  ],
  LU: [
    "Luxembourg City", "Esch-sur-Alzette", "Differdange", "Dudelange", "Ettelbruck", "Diekirch", "Wiltz", "Echternach", "Rumelange", "Grevenmacher",
    "Bettembourg", "Schifflange", "Pétange", "Bertrange", "Strassen", "Mamer", "Kayl", "Bascharage", "Mersch", "Remich"
  ],
  MG: [
    "Antananarivo", "Toamasina", "Antsirabe", "Fianarantsoa", "Mahajanga", "Toliara", "Antsiranana", "Ambanja", "Ambovombe", "Nosy Be",
    "Ihosy", "Sambava", "Maroantsetra", "Mananjary", "Morondava", "Manakara", "Ambilobe", "Farafangana", "Betioky", "Tsiroanomandidy"
  ],
  MW: [
    "Lilongwe", "Blantyre", "Mzuzu", "Zomba", "Karonga", "Kasungu", "Mangochi", "Salima", "Nkhotakota", "Chiradzulu",
    "Chikwawa", "Machinga", "Ntcheu", "Dedza", "Dowa", "Mchinji", "Ntchisi", "Nkhata Bay", "Mzimba", "Rumphi"
  ],
  MY: [
    "Kuala Lumpur", "George Town", "Johor Bahru", "Ipoh", "Shah Alam", "Petaling Jaya", "Kota Kinabalu", "Kuching", "Melaka", "Alor Setar",
    "Kuantan", "Taiping", "Seremban", "Sandakan", "Kota Bharu", "Tawau", "Sibu", "Miri", "Kluang", "Muar",
    "Kajang", "Selayang", "Rawang", "Subang Jaya", "Puchong", "Cheras", "Ampang", "Batu Pahat", "Kangar", "Teluk Intan"
  ],
  MV: ["Malé", "Addu City", "Fuvahmulah", "Kulhudhuffushi", "Thinadhoo", "Naifaru", "Dhiddhoo", "Muli", "Veymandoo", "Fonadhoo", "Eydhafushi", "Manadhoo", "Ungoofaaru", "Funadhoo", "Hithadhoo"],
  ML: [
    "Bamako", "Sikasso", "Mopti", "Koutiala", "Kayes", "Ségou", "Gao", "Timbuktu", "Koulikoro", "Nioro",
    "San", "Bougouni", "Kidal", "Bafoulabé", "Kita", "Kéniéba", "Diré", "Gourma-Rharous", "Djénné", "Ténenkou"
  ],
  MT: ["Valletta", "Birkirkara", "Mosta", "Sliema", "San Gwann", "Qormi", "St. Paul's Bay", "Rabat", "Zabbar", "Naxxar", "Attard", "Balzan", "Iklin", "Lija", "Mellieħa"],
  MH: ["Majuro", "Ebeye", "Kwajalein", "Jabor", "Wotje", "Enewetak", "Utirik", "Mili", "Ailuk", "Likiep", "Namdrik", "Ebon", "Arno", "Jaluit", "Kili"],
  MR: [
    "Nouakchott", "Nouadhibou", "Zouérat", "Kaédi", "Kiffa", "Rosso", "Atar", "Boutilimit", "Aleg", "Tidjikja",
    "Sélibaby", "Boghé", "Mbout", "Moudjeria", "Timbedra", "Nema", "Akjoujt", "F'Derik", "Choum", "Bouhdida"
  ],
  MU: [
    "Port Louis", "Rose Hill", "Quatre Bornes", "Curepipe", "Vacoas", "Triolet", "Goodlands", "Bel Air", "Mahébourg",
    "Beau Bassin", "Port Mathurin", "Grand Gaube", "Flic en Flac", "Pamplemousses", "Rivière du Rempart", "Chemin Grenier", "Dagotière", "L'Escalier", "Centre de Flacq"
  ],
  MX: [
    "Mexico City", "Guadalajara", "Monterrey", "Puebla", "Tijuana", "León", "Ciudad Juárez", "Zapopan", "Cancún",
    "Ecatepec", "Mérida", "San Luis Potosí", "Aguascalientes", "Mexicali", "Hermosillo", "Morelia", "Chihuahua", "Naucalpan", "Toluca",
    "Querétaro", "Culiacán", "Saltillo", "Torreón", "Durango", "Tuxtla Gutiérrez", "Reynosa", "Irapuato", "Acapulco",
    "Xalapa", "Nuevo Laredo", "Tampico", "Mazatlán", "Campeche", "Oaxaca", "Cuernavaca", "Pachuca", "Villahermosa", "Colima",
    "Celaya", "Guanajuato", "Zacatecas", "Tepic", "Chetumal", "La Paz", "Los Cabos", "Ensenada", "Rosarito", "Nezahualcóyotl"
  ],
  FM: ["Palikir", "Weno", "Kolonia", "Tofol", "Lelu", "Nett", "Chuuk", "Pohnpei", "Yap", "Kosrae", "Pingelap", "Mwoakilloa", "Sapwuahfik", "Nukuoro", "Kapingamarangi"],
  MD: [
    "Chișinău", "Bălți", "Tiraspol", "Bender", "Cahul", "Orhei", "Ungheni", "Soroca", "Comrat", "Edineț",
    "Strășeni", "Hîncești", "Dondușeni", "Drochia", "Călărași", "Criuleni", "Rîbnița", "Florești", "Nisporeni", "Leova"
  ],
  MC: ["Monaco", "Monte Carlo", "Fontvieille", "La Condamine", "Larvotto", "Saint-Roman", "Les Révoires", "Moneghetti", "Spélugues", "Le Port"],
  MN: [
    "Ulaanbaatar", "Erdenet", "Darkhan", "Choibalsan", "Mörön", "Ölgii", "Khovd", "Sainshand", "Dalanzadgad", "Züünkharaa",
    "Bayanhongor", "Arvaikheer", "Ulaangom", "Altai", "Baruun-Urt", "Sukhbaatar", "Mandalgovi", "Tsetserleg", "Bulgan", "Zuunmod"
  ],
  ME: [
    "Podgorica", "Nikšić", "Pljevlja", "Bar", "Bijelo Polje", "Cetinje", "Herceg Novi", "Budva", "Tivat", "Kotor",
    "Ulcinj", "Rožaje", "Berane", "Kolašin", "Plav", "Žabljak", "Mojkovac", "Danilovgrad", "Petrovac", "Andrijevica"
  ],
  MA: [
    "Casablanca", "Rabat", "Marrakesh", "Fez", "Tangier", "Agadir", "Meknes", "Oujda", "Kenitra", "Tetouan",
    "Safi", "Salé", "El Jadida", "Beni Mellal", "Nador", "Taza", "Mohammedia", "Laâyoune", "Khouribga", "Settat",
    "Essaouira", "Guelmim", "Ouarzazate", "Al Hoceima", "Dakhla", "Ifrane", "Azrou", "Ksar el-Kebir", "Larache", "Taourirt",
    "Berrechid", "Sidi Kacem", "Tiflet", "Sefrou", "Taounate", "Tiznit", "Tinghir", "Zagora", "Sidi Ifni", "Taroudant"
  ],
  MZ: [
    "Maputo", "Matola", "Beira", "Nampula", "Chimoio", "Quelimane", "Tete", "Xai-Xai", "Inhambane", "Lichinga",
    "Pemba", "Angoche", "Mocuba", "Manica", "Dondo", "Vilanculos", "Chokwe", "Maxixe", "Cuamba", "Montepuez",
    "Nacala", "Gurúè", "Moatize", "Boane", "Manhiça", "Marracuene", "Namialo", "Mecuburi", "Ressano Garcia", "Ilha de Moçambique"
  ],
  MM: [
    "Yangon", "Mandalay", "Naypyidaw", "Mawlamyine", "Bago", "Pathein", "Monywa", "Sittwe", "Meiktila", "Myitkyina",
    "Taunggyi", "Myeik", "Pyay", "Hpa-An", "Lashio", "Mogok", "Magway", "Hinthada", "Dawei", "Bhamo"
  ],
  NA: [
    "Windhoek", "Rundu", "Walvis Bay", "Oshakati", "Swakopmund", "Katima Mulilo", "Tsumeb", "Grootfontein", "Otjiwarongo", "Keetmanshoop",
    "Okahandja", "Mariental", "Gobabis", "Omuthiya", "Ongwediva", "Lüderitz", "Outjo", "Usakos", "Rehoboth", "Aranos"
  ],
  NR: ["Yaren", "Boe", "Aiwo", "Anabar", "Menen", "Uaboe", "Denigomodu", "Nibok", "Ijuw", "Ewa", "Baitsi", "Anetan", "Anibare", "Baiti"],
  NP: [
    "Kathmandu", "Pokhara", "Lalitpur", "Bharatpur", "Biratnagar", "Birgunj", "Janakpur", "Dharan", "Hetauda", "Butwal",
    "Nepalgunj", "Dhangaḍhi", "Bhimdatta", "Madhyapur Thimi", "Itahari", "Siddharthanagar", "Dhankuta", "Kirtipur", "Damak", "Ghorahi"
  ],
  NL: [
    "Amsterdam", "Rotterdam", "The Hague", "Utrecht", "Eindhoven", "Groningen", "Tilburg", "Almere", "Breda", "Nijmegen",
    "Enschede", "Haarlem", "Arnhem", "Amersfoort", "Apeldoorn", "Den Bosch", "Zwolle", "Leeuwarden", "Leiden",
    "Maastricht", "Dordrecht", "Delft", "Venlo", "Gouda", "Hilversum", "Assen", "Lelystad", "Helmond", "Alkmaar"
  ],
  NZ: [
    "Auckland", "Wellington", "Christchurch", "Hamilton", "Tauranga", "Napier", "Dunedin", "Palmerston North", "New Plymouth", "Whangārei",
    "Invercargill", "Rotorua", "Hastings", "Gisborne", "Nelson", "Blenheim", "Queenstown", "Masterton", "Timaru", "Ashburton",
    "Cambridge", "Taupō", "Pukekohe", "Whakatāne", "Porirua", "Lower Hutt", "Upper Hutt", "Papakura", "Paraparaumu", "Levin"
  ],
  NI: [
    "Managua", "León", "Masaya", "Matagalpa", "Chinandega", "Granada", "Estelí", "Tipitapa", "Juigalpa", "Jinotega",
    "Rivas", "Bluefields", "Boaco", "Ocotal", "Somoto", "San Carlos", "Siuna", "El Rama", "Puerto Cabezas", "Diriamba"
  ],
  NE: [
    "Niamey", "Zinder", "Maradi", "Tahoua", "Agadez", "Dosso", "Diffa", "Tillabéri", "Téra", "Birni N'Konni",
    "Madaoua", "Mirriah", "Maine-Soroa", "N'Guigmi", "Tchirozerine", "Arlit", "Gaya", "Say", "Kollo", "Ouallam"
  ],
  NG: [
    "Lagos", "Kano", "Ibadan", "Abuja", "Port Harcourt", "Benin City", "Maiduguri", "Zaria", "Aba", "Jos",
    "Ilorin", "Oyo", "Enugu", "Kaduna", "Bauchi", "Warri", "Uyo", "Ogbomoso", "Sokoto",
    "Akure", "Ado Ekiti", "Abeokuta", "Nnewi", "Yola", "Umuahia", "Calabar", "Katsina", "Minna", "Gombe",
    "Awka", "Onitsha", "Nsukka", "Makurdi", "Lafia", "Otukpo", "Gboko", "Ikom", "Ogoja", "Jalingo"
  ],
  KP: ["Pyongyang", "Hamhung", "Chongjin", "Nampo", "Wonsan", "Sinuiju", "Kaesong", "Haeju", "Rason", "Sariwon", "Songnim", "Kusong", "Anju", "Kanggye", "Suncheon"],
  MK: [
    "Skopje", "Bitola", "Kumanovo", "Prilep", "Tetovo", "Ohrid", "Veles", "Strumica", "Gostivar", "Kavadarci",
    "Kočani", "Struga", "Kičevo", "Gevgelija", "Shtip", "Radoviš", "Negotino", "Vinica", "Probištip", "Delčevo"
  ],
  NO: [
    "Oslo", "Bergen", "Trondheim", "Stavanger", "Drammen", "Fredrikstad", "Kristiansand", "Tromsø", "Sandnes", "Bodø",
    "Sarpsborg", "Skien", "Ålesund", "Haugesund", "Sandefjord", "Arendal", "Porsgrunn", "Gjøvik", "Molde", "Larvik",
    "Lillehammer", "Harstad", "Tønsberg", "Kongsberg", "Hamar", "Moss", "Alta", "Kirkenes", "Narvik", "Steinkjer"
  ],
  OM: [
    "Muscat", "Seeb", "Salalah", "Barka", "Sur", "Khasab", "Nizwa", "Ibri", "Sohar", "Ibra",
    "Rustaq", "Adam", "Bidbid", "Samail", "Bahla", "Bawshar", "Muttrah", "Sidab", "Ruwi", "Qurm"
  ],
  PK: [
    "Karachi", "Lahore", "Faisalabad", "Rawalpindi", "Multan", "Peshawar", "Islamabad", "Quetta", "Sargodha", "Sialkot",
    "Gujranwala", "Jhang", "Larkana", "Sukkur", "Rahim Yar Khan", "Mardan", "Kasur", "Hyderabad", "Nawabshah",
    "Abbottabad", "Sahiwal", "Bahawalpur", "Gwadar", "Mingora", "Okara", "Muzaffarabad", "Chiniot", "Jhelum", "Gujrat"
  ],
  PW: ["Ngerulmud", "Koror", "Melekeok", "Airai", "Kayangel", "Ngiwal", "Ngaraard", "Ngatpang", "Ngchesar", "Peleliu", "Angaur", "Sonsorol", "Hatohobei", "Babeldaob", "Rock Islands"],
  PS: [
    "Gaza", "Ramallah", "Nablus", "Bethlehem", "Jericho", "Hebron", "Jenin", "Tulkarm", "Qalqilya", "Salfit",
    "Tubas", "Deir al-Balah", "Khan Yunis", "Rafah", "Beita", "Beit Lahia", "Al-Bireh", "Abasan", "Beit Jala", "Beit Sahour",
    "Jerusalem", "Al-Quds", "Abu Dis", "Bethany", "Birzeit", "Halhul", "Yatta", "Dura", "Eizariya", "Ram"
  ],
  PA: [
    "Panama City", "San Miguelito", "Colón", "David", "La Chorrera", "Santiago", "Chitré", "Penonomé", "Aguadulce", "Las Tablas",
    "Bocas del Toro", "Changuinola", "Puerto Armuelles", "La Palma", "Boquete", "Volcán", "Cerro Punta", "Mendoza", "Villa Unida", "El Porvenir"
  ],
  PG: ["Port Moresby", "Lae", "Mount Hagen", "Madang", "Wewak", "Goroka", "Kokopo", "Rabaul", "Popondetta", "Arawa", "Kimbe", "Kavieng", "Vanimo", "Buka", "Daru"],
  PY: [
    "Asunción", "Ciudad del Este", "Encarnación", "San Lorenzo", "Luque", "Capiatá", "Lambaré", "Fernando de la Mora", "Caaguazú",
    "Coronel Oviedo", "Pedro Juan Caballero", "Villarrica", "Concepción", "Salto del Guairá", "Presidente Franco", "San Antonio", "Itauguá", "Hernandarias", "Minga Guazú"
  ],
  PE: [
    "Lima", "Arequipa", "Cusco", "Trujillo", "Chiclayo", "Piura", "Iquitos", "Huancayo", "Chimbote", "Tacna",
    "Cajamarca", "Pucallpa", "Juliaca", "Ayacucho", "Huánuco", "Ica", "Sullana", "Puerto Maldonado", "Abancay",
    "Tingo María", "Chachapoyas", "Moquegua", "Puno", "Huacho", "Bagua", "Moyobamba", "Jauja", "Andahuaylas", "Cerro de Pasco"
  ],
  PH: [
    "Manila", "Quezon City", "Cebu City", "Davao City", "Makati", "Pasig", "Antipolo", "Cagayan de Oro", "Taguig", "Zamboanga City",
    "General Santos", "Bacolod", "Iloilo City", "Pasay", "Muntinlupa", "Caloocan", "Paranaque", "Marikina", "Baguio", "Las Piñas",
    "Butuan", "Cabanatuan", "Batangas City", "Naga", "Malolos", "Olongapo", "Dagupan", "Angeles City", "San Fernando", "Tarlac City"
  ],
  PL: [
    "Warsaw", "Kraków", "Łódź", "Wrocław", "Poznań", "Gdańsk", "Szczecin", "Bydgoszcz", "Lublin", "Białystok",
    "Katowice", "Gdynia", "Częstochowa", "Radom", "Toruń", "Kielce", "Rzeszów", "Gliwice", "Zabrze", "Olsztyn",
    "Bielsko-Biała", "Tychy", "Bytom", "Rybnik", "Zielona Góra", "Opole", "Elbląg", "Płock", "Tarnów", "Koszalin"
  ],
  PT: [
    "Lisbon", "Porto", "Braga", "Coimbra", "Funchal", "Amadora", "Setúbal", "Almada", "Aveiro", "Vila Nova de Gaia",
    "Portimão", "Faro", "Leiria", "Viseu", "Ponta Delgada", "Santarém", "Evora", "Castelo Branco", "Guimarães",
    "Cascais", "Oeiras", "Sintra", "Loures", "Matosinhos", "Maia", "Gondomar", "Valongo", "Albufeira", "Caldas da Rainha"
  ],
  QA: [
    "Doha", "Al Rayyan", "Al Wakrah", "Umm Salal", "Al Khor", "Al Shamal", "Dukhan", "Mesaieed", "Lusail",
    "Al Daayen", "Ash Shahaniyah", "Az Za'ayin", "Umm Bab", "Al Jumaliyah", "Al Kharaitiyat", "Al Sailiya", "Madinat Khalifa", "Fereej Abdel Aziz"
  ],
  RO: [
    "Bucharest", "Cluj-Napoca", "Timișoara", "Iași", "Constanța", "Brașov", "Sibiu", "Oradea", "Arad", "Pitești",
    "Galați", "Brăila", "Târgu Mureș", "Bacău", "Suceava", "Craiova", "Ploiești", "Râmnicu Vâlcea", "Baia Mare", "Satu Mare",
    "Deva", "Hunedoara", "Alba Iulia", "Sighișoara", "Mediaș", "Reșița", "Lugoj", "Zalău", "Odorheiu Secuiesc", "Miercurea Ciuc"
  ],
  RU: [
    "Moscow", "Saint Petersburg", "Novosibirsk", "Yekaterinburg", "Kazan", "Nizhny Novgorod", "Chelyabinsk", "Samara", "Omsk", "Rostov-on-Don",
    "Ufa", "Krasnoyarsk", "Voronezh", "Perm", "Volgograd", "Krasnodar", "Saratov", "Tyumen", "Tolyatti", "Izhevsk",
    "Barnaul", "Ulyanovsk", "Irkutsk", "Kemerovo", "Novokuznetsk", "Ryazan", "Astrakhan", "Tula", "Penza", "Kirov",
    "Lipetsk", "Cheboksary", "Kaliningrad", "Makhachkala", "Tver", "Vladivostok", "Murmansk", "Sochi", "Kursk", "Ulan-Ude"
  ],
  RW: [
    "Kigali", "Butare", "Ruhengeri", "Gitarama", "Cyangugu", "Nyanza", "Kibungo", "Kibuye", "Gisenyi", "Byumba",
    "Rwamagana", "Nyamata", "Muhanga", "Nyagatare", "Kayonza", "Ruhango", "Ngororero", "Karongi", "Nyamasheke", "Rusizi"
  ],
  KN: ["Basseterre", "Charlestown", "Sandy Point Town", "Dieppe Bay Town", "Cayon", "Trinity", "Saint Paul's", "Nicola Town", "Cotton Ground", "Newcastle", "Old Road Town", "Saddlers", "Tabernacle", "Mansion"],
  LC: ["Castries", "Gros Islet", "Vieux Fort", "Soufrière", "Micoud", "Dennery", "Anse La Raye", "Laborie", "Choiseul", "Canaries", "Mon Repos", "Bocage", "Morne Valley", "Entrepot"],
  VC: ["Kingstown", "Georgetown", "Chateaubelair", "Barrouallie", "Layou", "Biabou", "Calliaqua", "Port Elizabeth", "Fancy", "Owia", "Rutland Vale", "Troumaca", "Spring Village", "Wallilabou"],
  WS: ["Apia", "Vaitele", "Faleula", "Siusega", "Afenga", "Malie", "Matautu", "Solosolo", "Samamea", "Safotu", "Salelologa", "Lotofaga", "Fasito'o", "Lufilufi"],
  SM: ["San Marino", "Serravalle", "Borgo Maggiore", "Domagnano", "Fiorentino", "Montegiardino", "Acquaviva", "Faetano", "Chiesanuova", "Dogana"],
  ST: ["São Tomé", "Neves", "Trindade", "Santana", "Santo Amaro", "Guadalupe", "Porto Alegre", "Santa Catarina", "São João dos Angolares", "Calvário", "Monte Café", "Água Izé", "Ribeira Afonso", "São Miguel"],
  SA: [
    "Riyadh", "Jeddah", "Mecca", "Medina", "Dammam", "Khobar", "Tabuk", "Taif", "Yanbu", "Buraydah",
    "Abha", "Khamis Mushait", "Najran", "Jubail", "Hail", "Qatif", "Jizan", "Hofuf", "Dhahran", "Al Bahah",
    "Arar", "Sakaka", "Rafha", "Al Khafji", "Al Qunfudhah", "Al Zulfi", "Ad Dawadimi", "Al Majma'ah", "Unaizah", "Sabya"
  ],
  SN: [
    "Dakar", "Thiès", "Saint-Louis", "Kaolack", "Ziguinchor", "Touba", "Mbour", "Diourbel", "Louga", "Fatick",
    "Kolda", "Tambacounda", "Kédougou", "Sédhiou", "Matam", "Podor", "Dagana", "Kaffrine", "Pikine", "Rufisque"
  ],
  RS: [
    "Belgrade", "Novi Sad", "Niš", "Kragujevac", "Subotica", "Zrenjanin", "Pančevo", "Čačak", "Kruševac", "Kraljevo",
    "Novi Pazar", "Smederevo", "Leskovac", "Valjevo", "Vranje", "Šabac", "Užice", "Požarevac", "Pirot", "Sombor"
  ],
  SC: ["Victoria", "Anse Boileau", "Beau Vallon", "Cascade", "Machabee", "Pointe La Rue", "Takamaka", "Anse Royale", "Grand Anse", "Baie Lazare", "La Digue", "Praslin", "Eden Island", "Cerf Island", "Frégate Island"],
  SL: [
    "Freetown", "Bo", "Kenema", "Makeni", "Koidu Town", "Port Loko", "Kabala", "Kailahun", "Bonthe", "Pujehun",
    "Moyamba", "Kambia", "Magburaka", "Waterloo", "Lunsar", "Pepel", "Yengema", "Sefadu", "Goderich", "Hastings"
  ],
  SG: [
    "Singapore", "Woodlands", "Tampines", "Jurong West", "Bedok", "Hougang", "Sengkang", "Choa Chu Kang", "Toa Payoh", "Bukit Merah",
    "Serangoon", "Geylang", "Punggol", "Kallang", "Clementi", "Bukit Panjang", "Pasir Ris", "Ang Mo Kio", "Queenstown", "Yishun"
  ],
  SK: [
    "Bratislava", "Košice", "Prešov", "Žilina", "Nitra", "Banská Bystrica", "Trnava", "Martin", "Trenčín", "Poprad",
    "Prievidza", "Zvolen", "Považská Bystrica", "Michalovce", "Spišská Nová Ves", "Komárno", "Humené", "Levice", "Bardejov", "Liptovský Mikuláš"
  ],
  SI: [
    "Ljubljana", "Maribor", "Celje", "Kranj", "Koper", "Velenje", "Novo Mesto", "Ptuj", "Trbovlje", "Kamnik",
    "Jesenice", "Nova Gorica", "Murska Sobota", "Škofja Loka", "Domžale", "Kočevje", "Postojna", "Sežana", "Slovenj Gradec", "Litija"
  ],
  SB: ["Honiara", "Gizo", "Auki", "Buala", "Kirakira", "Lata", "Taro", "Munda", "Tulagi", "Noro", "Rennell", "Tingoa", "Seghe", "Marau Sound"],
  SO: [
    "Mogadishu", "Hargeisa", "Kismayo", "Baidoa", "Bosaso", "Garowe", "Merca", "Jowhar", "Beledweyne", "Galkayo",
    "Bu'aale", "Qardho", "Erigavo", "Luuq", "Bandarbeyla", "Bardera", "Burao", "Berbera", "Borama", "Baki"
  ],
  ZA: [
    "Johannesburg", "Cape Town", "Durban", "Pretoria", "Port Elizabeth", "Bloemfontein", "Pietermaritzburg", "Welkom", "Soweto",
    "East London", "Vereeniging", "Kimberley", "Polokwane", "Nelspruit", "Rustenburg", "Mafikeng", "George", "Umtata",
    "Stellenbosch", "Paarl", "Worcester", "Upington", "Klerksdorp", "Krugersdorp", "Randburg", "Boksburg", "Benoni", "Carletonville"
  ],
  KR: [
    "Seoul", "Busan", "Incheon", "Daegu", "Daejeon", "Gwangju", "Suwon", "Ulsan", "Yongin", "Seongnam",
    "Bucheon", "Jeonju", "Cheongju", "Ansan", "Changwon", "Anyang", "Pohang", "Uijeongbu", "Hwaseong", "Siheung",
    "Goyang", "Gimhae", "Jeju City", "Cheonan", "Wonju", "Chuncheon", "Gangneung", "Mokpo", "Suncheon", "Yeosu"
  ],
  SS: ["Juba", "Malakal", "Wau", "Bor", "Yei", "Bentiu", "Rumbek", "Torit", "Nimule", "Yambio", "Aweil", "Kapoeta", "Maridi", "Pibor", "Tambura"],
  ES: [
    "Madrid", "Barcelona", "Valencia", "Seville", "Zaragoza", "Málaga", "Murcia", "Palma", "Bilbao", "Alicante",
    "Córdoba", "Valladolid", "Vigo", "Gijón", "Granada", "San Sebastián", "Pamplona", "Santander", "Toledo",
    "Salamanca", "Huelva", "Tarragona", "Lleida", "Castellón", "León", "Ourense", "Cadiz", "Albacete", "Logroño",
    "Burgos", "Santiago de Compostela", "Badajoz", "Almería", "Jaén", "Lugo", "Pontevedra", "Ávila", "Segovia", "Soria"
  ],
  LK: [
    "Colombo", "Kandy", "Galle", "Jaffna", "Negombo", "Trincomalee", "Batticaloa", "Matara", "Anuradhapura", "Kurunegala",
    "Badulla", "Ratnapura", "Kalutara", "Moratuwa", "Mount Lavinia", "Dehiwala", "Kotte", "Nugegoda", "Maharagama", "Nawala"
  ],
  SD: [
    "Khartoum", "Omdurman", "Khartoum North", "Port Sudan", "Kassala", "Nyala", "El Obeid", "Gedaref", "Wad Madani", "Dongola",
    "Atbara", "El Fasher", "Ed Damazin", "Sennar", "Kosti", "El Geneina", "Shendi", "Al Qadarif", "Rabak", "Ad-Damazin",
    "El Managil", "El Hasaheisa", "Berber", "Halfa Al Jadidah", "Dilling", "El Daein", "Kadugli", "El Lagowa", "Zalingei",
    "El Nuhud", "Rashad", "Umm Ruwaba", "Ed Dueim", "Tandalti", "Um Kadada", "Marawi", "Kerma", "Ad Dabbah", "Dunqula",
    "Kuraymah", "Talodi", "Abu Jubayhah", "Al Fulah", "Ghebeish", "Babanusa", "Muglad", "El Fula", "Edd al Fursan",
    "Telkuk", "Abu Hamad", "Karima", "Merowe", "Arba'at", "Tokar", "Hayya", "Er Roseires", "Al Kurumuk", "Wad Rawa"
  ],
  SR: [
    "Paramaribo", "Lelydorp", "Nieuw Nickerie", "Moengo", "Albina", "Groningen", "Onverwacht", "Totness", "Benzdorp", "Brownsweg",
    "Nieuw Amsterdam", "Brokopondo", "Mariënburg", "Meerzorg", "Santigron", "Wanica", "Sunny Point", "Galibi", "Kwakoegron", "Casia"
  ],
  SE: [
    "Stockholm", "Gothenburg", "Malmö", "Uppsala", "Linköping", "Västerås", "Örebro", "Helsingborg", "Norrköping", "Jönköping",
    "Umeå", "Lund", "Gävle", "Borås", "Sundsvall", "Eskilstuna", "Halmstad", "Karlstad", "Luleå", "Kristianstad",
    "Kalmar", "Visby", "Växjö", "Östersund", "Kiruna", "Södertälje", "Motala", "Nyköping", "Ystad", "Ängelholm"
  ],
  CH: [
    "Zürich", "Geneva", "Basel", "Bern", "Lausanne", "St. Gallen", "Lucerne", "Winterthur", "Lugano", "Biel",
    "Thun", "Fribourg", "La Chaux-de-Fonds", "Schaffhausen", "Neuchâtel", "Vernier", "Zug", "Uster", "Sion",
    "Montreux", "Chur", "Aarau", "Wil", "Rapperswil", "Baden", "Allschwil", "Pully", "Meyrin", "Olten"
  ],
  SY: [
    "Damascus", "Aleppo", "Homs", "Latakia", "Hama", "Deir ez-Zor", "Raqqa", "Hasaka", "Idlib", "Daraa",
    "Sweida", "Tartus", "Qamishli", "Manbij", "Afrin", "Azaz", "Jableh", "Masyaf", "Safita", "Baniyas",
    "Al-Sanamayn", "Izra", "Nawa", "Tadmur", "Rastan", "Jarabulus", "Al-Bab", "Muhradah", "Kafr Zita", "Talbiseh"
  ],
  TW: [
    "Taipei", "Kaohsiung", "Taichung", "Tainan", "Taoyuan", "New Taipei", "Keelung", "Hsinchu", "Chiayi", "Changhua",
    "Pingtung", "Yilan", "Hualien", "Taitung", "Nantou", "Miaoli", "Yunlin", "Penghu", "Kinmen", "Lienchiang"
  ],
  TJ: [
    "Dushanbe", "Khujand", "Kulob", "Bokhtar", "Istaravshan", "Konibodom", "Vahdat", "Tursunzoda", "Panjakent", "Khorugh",
    "Isfara", "Roghun", "Nurek", "Danghara", "Farkhor", "Hamadoni", "Muminobod", "Rasht", "Sangtuda", "Shahrituz"
  ],
  TZ: [
    "Dar es Salaam", "Mwanza", "Arusha", "Mbeya", "Morogoro", "Tanga", "Zanzibar City", "Dodoma", "Kigoma",
    "Moshi", "Tabora", "Shinyanga", "Songea", "Bukoba", "Musoma", "Iringa", "Njombe", "Sumbawanga", "Bunda",
    "Mtwara", "Lindi", "Singida", "Babati", "Kilosa", "Ifakara", "Kibaha", "Bagamoyo", "Chake Chake", "Same"
  ],
  TH: [
    "Bangkok", "Chiang Mai", "Phuket", "Pattaya", "Nonthaburi", "Hat Yai", "Nakhon Ratchasima", "Khon Kaen", "Udon Thani", "Nakhon Si Thammarat",
    "Chonburi", "Surat Thani", "Songkhla", "Chiang Rai", "Hua Hin", "Krabi", "Samut Prakan", "Rayong", "Phitsanulok",
    "Ayutthaya", "Kanchanaburi", "Ratchaburi", "Suphan Buri", "Nakhon Sawan", "Ubon Ratchathani", "Roi Et", "Si Sa Ket", "Surin", "Buriram"
  ],
  TL: [
    "Dili", "Baucau", "Liquiçá", "Manatuto", "Same", "Maliana", "Viqueque", "Lospalos", "Suai", "Ermera",
    "Aileu", "Ainaro", "Bobonaro", "Cova Lima", "Lautém", "Oecusse", "Atauro", "Maubisse", "Pante Macassar", "Tutuala"
  ],
  TG: [
    "Lomé", "Sokodé", "Kara", "Kpalimé", "Atakpamé", "Bassar", "Tsévié", "Aného", "Mango", "Dapaong",
    "Tchamba", "Niamtougou", "Bafilo", "Notse", "Sotouboua", "Tabligbo", "Amlamé", "Badjou", "Tandjouare", "Pagegou"
  ],
  TO: ["Nuku'alofa", "Neiafu", "Havelu", "Mu'a", "Vaini", "Pangai", "Kolonga", "Foa", "Pangaimotu", "Utulei", "Nomuka", "Ha'apai", "Niua", "Eua", "Tongatapu"],
  TT: [
    "Port of Spain", "San Fernando", "Chaguanas", "Arima", "Tunapuna", "Scarborough", "Siparia", "Princes Town", "Couva", "Point Fortin",
    "Diego Martin", "Penal", "Debe", "Tabaquite", "Roxborough", "Morvant", "Laventille", "St. Joseph", "Carenage", "Woodbrook"
  ],
  TN: [
    "Tunis", "Sfax", "Sousse", "Kairouan", "Bizerte", "Gabès", "Ariana", "Gafsa", "Monastir", "Ben Arous",
    "Médenine", "Nabeul", "Kasserine", "Tataouine", "Béja", "Siliana", "Le Kef", "Zaghouan", "Mahdia", "Kebili",
    "Tozeur", "Jendouba", "Sidi Bouzid", "Korba", "Hammamet", "La Marsa", "Le Bardo", "Mégrine",
    "Radès", "Ezzahra", "Hammam Lif", "Mourouj", "Fouchana", "Mornag", "Menzel Bourguiba", "Menzel Temime",
    "Kelibia", "Haouaria", "Bou Argoub", "Grombalia", "Soliman", "Béni Khiar", "Dar Chaabane", "Menzel Bou Zelfa", "Bembla",
    "Téboulba", "Ksar Hellal", "Bekalta", "Sayada", "Lamta", "Bou Merdes", "El Jem", "Jebeniana", "El Hamma", "Mareth",
    "Kebili", "Douz", "Matmata", "Tamezret", "Toujane", "Chenini", "Mides", "Tataouine", "Ghomrassen", "Beni Khedache"
  ],
  TR: [
    "Istanbul", "Ankara", "Izmir", "Bursa", "Antalya", "Adana", "Konya", "Gaziantep", "Mersin", "Kayseri",
    "Eskişehir", "Diyarbakır", "Samsun", "Denizli", "Şanlıurfa", "Trabzon", "Malatya", "Erzurum", "Van", "Elazığ",
    "Manisa", "Kocaeli", "Sakarya", "Balıkesir", "Hatay", "Aydın", "Muğla", "Mardin", "Tekirdağ", "Isparta",
    "Çanakkale", "Edirne", "Bolu", "Kütahya", "Çorum", "Rize", "Giresun", "Ordu", "Kastamonu", "Antakya"
  ],
  TM: [
    "Ashgabat", "Türkmenabat", "Daşoguz", "Mary", "Balkanabat", "Bayramaly", "Tejen", "Kaka", "Serdar", "Gumdag",
    "Abadan", "Seydi", "Gazojak", "Bezmein", "Bereket", "Köneürgench", "Anew", "Sakar", "Gökdepe", "Murgap"
  ],
  TV: ["Funafuti", "Vaiaku", "Alapi", "Fakaifou", "Senala", "Kulia", "Savave", "Fangaua", "Tanrake", "Tonga", "Nanumea", "Nui", "Nukufetau", "Nukulaelae", "Vaitupu"],
  UG: [
    "Kampala", "Gulu", "Mbarara", "Jinja", "Mbale", "Entebbe", "Soroti", "Arua", "Lira", "Masaka",
    "Kasese", "Fort Portal", "Tororo", "Busia", "Kabale", "Hoima", "Iganga", "Mubende", "Mityana",
    "Mukono", "Namasuba", "Kira", "Kawempe", "Makindye", "Nansana", "Wakiso", "Bombo", "Lugazi", "Njeru"
  ],
  UA: [
    "Kyiv", "Kharkiv", "Odesa", "Dnipro", "Lviv", "Zaporizhzhia", "Kryvyi Rih", "Mykolaiv", "Vinnytsia", "Poltava",
    "Chernihiv", "Cherkasy", "Sumy", "Zhytomyr", "Rivne", "Ivano-Frankivsk", "Ternopil", "Lutsk", "Uzhhorod", "Kropyvnytskyi",
    "Kremenchuk", "Bila Tserkva", "Melitopol", "Kherson", "Nikopol", "Berdiansk", "Pavlohrad", "Konotop", "Brovary", "Kamianske"
  ],
  AE: [
    "Dubai", "Abu Dhabi", "Sharjah", "Ajman", "Ras Al Khaimah", "Fujairah", "Umm Al Quwain", "Al Ain", "Khor Fakkan", "Dibba Al-Fujairah",
    "Madinat Zayed", "Ruwais", "Liwa Oasis", "Hatta", "Kalba", "Dhaid", "Al Madam", "Al Gharbia", "Ar-Rams", "Al Jazirah Al Hamra"
  ],
  GB: [
    "London", "Birmingham", "Manchester", "Glasgow", "Liverpool", "Leeds", "Sheffield", "Edinburgh", "Bristol", "Cardiff",
    "Leicester", "Coventry", "Nottingham", "Newcastle", "Southampton", "Portsmouth", "Brighton", "Belfast", "Aberdeen", "Derby",
    "Plymouth", "Wolverhampton", "Sunderland", "Stoke-on-Trent", "Swansea", "Middlesbrough", "Bradford", "Milton Keynes",
    "Reading", "Oxford", "Cambridge", "Exeter", "York", "Chester", "Bath", "Ipswich", "Norwich", "Peterborough",
    "Bournemouth", "Dundee", "Luton", "Northampton", "Preston", "Swindon", "Watford", "Wigan", "Worcester", "Hull"
  ],
  US: [
    "New York City", "Los Angeles", "Chicago", "Houston", "Phoenix", "Philadelphia", "San Antonio", "San Diego", "Dallas", "San Jose",
    "Austin", "Jacksonville", "Fort Worth", "Columbus", "Charlotte", "Indianapolis", "San Francisco", "Seattle", "Denver", "Nashville",
    "Washington D.C.", "Boston", "El Paso", "Detroit", "Memphis", "Portland", "Oklahoma City", "Las Vegas", "Louisville", "Baltimore",
    "Milwaukee", "Albuquerque", "Tucson", "Fresno", "Sacramento", "Kansas City", "Atlanta", "Omaha", "Colorado Springs",
    "Raleigh", "Miami", "Oakland", "Minneapolis", "Tampa", "Tulsa", "Arlington", "New Orleans", "Cleveland", "Honolulu",
    "St. Louis", "Pittsburgh", "Cincinnati", "Boise", "Richmond", "Spokane", "Bakersfield", "Anaheim", "Riverside", "Santa Ana"
  ],
  UY: [
    "Montevideo", "Salto", "Paysandú", "Las Piedras", "Rivera", "Maldonado", "Tacuarembó", "Melo", "Mercedes", "Artigas",
    "Minas", "San José de Mayo", "Durazno", "Florida", "Treinta y Tres", "Rocha", "San Carlos", "Pando", "Fray Bentos",
    "Colonia del Sacramento", "Carmelo", "Nueva Palmira", "Punta del Este", "Atlántida", "La Paz", "Canelones", "Trinidad"
  ],
  UZ: [
    "Tashkent", "Samarkand", "Bukhara", "Nukus", "Andijan", "Namangan", "Fergana", "Qarshi", "Jizzakh", "Urgench",
    "Termez", "Navoiy", "Khiva", "Margilan", "Kokand", "Denau", "Shakhrisabz", "Chust", "Angren", "Gulistan"
  ],
  VU: ["Port Vila", "Luganville", "Norsup", "Isangel", "Sola", "Lakatoro", "Saratamata", "Santo", "Wintua", "Lamap", "Lenakel", "Port Olry", "Tanna", "Aneityum", "Epi"],
  VA: ["Vatican City"],
  VE: [
    "Caracas", "Maracaibo", "Valencia", "Barquisimeto", "Maracay", "Ciudad Guayana", "Barcelona", "Maturín", "Cumaná", "Ciudad Bolívar",
    "San Cristóbal", "Mérida", "Barinas", "Coro", "Guanare", "Los Teques", "Tucupita", "La Asunción", "San Felipe",
    "Puerto La Cruz", "Porlamar", "Punto Fijo", "Cagua", "Turmero", "Guarenas", "Guatire", "Acarigua", "Cabimas", "Valera"
  ],
  VN: [
    "Ho Chi Minh City", "Hanoi", "Da Nang", "Haiphong", "Can Tho", "Nha Trang", "Hue", "Da Lat", "Vung Tau", "Quy Nhon",
    "Rach Gia", "Long Xuyen", "Phan Thiet", "Bien Hoa", "My Tho", "Buon Ma Thuot", "Thai Nguyen", "Bac Ninh", "Nam Dinh", "Hai Duong",
    "Vinh", "Ha Tinh", "Dong Hoi", "Quang Ngai", "Pleiku", "Tuy Hoa", "Tam Ky", "Hoi An", "Ca Mau", "Tra Vinh",
    "Chau Doc", "Ha Tien", "Sa Dec", "Tan An", "Vinh Long", "Phan Rang", "Cam Ranh", "Bac Lieu", "Soc Trang", "Ben Tre"
  ],
  YE: [
    "Sana'a", "Aden", "Taiz", "Hodeidah", "Ibb", "Mukalla", "Dhamar", "Amran", "Sa'dah", "Zinjibar",
    "Marib", "Al Bayda", "Lahij", "Yarim", "Rada", "Seiyun", "Tarim", "Hajjah", "Al Ghaydah", "Al Hudaydah"
  ],
  ZM: [
    "Lusaka", "Ndola", "Kitwe", "Chipata", "Kabwe", "Livingstone", "Mufulira", "Chingola", "Luanshya", "Kasama",
    "Solwezi", "Mansa", "Kafue", "Mongu", "Mazabuka", "Choma", "Mpika", "Kansanshi", "Nchelenge", "Chinsali"
  ],
  ZW: [
    "Harare", "Bulawayo", "Chitungwiza", "Mutare", "Gweru", "Kwekwe", "Kadoma", "Masvingo", "Marondera", "Zvishavane",
    "Chinhoyi", "Chegutu", "Kariba", "Hwange", "Victoria Falls", "Bindura", "Norton", "Redcliff", "Rusape", "Chiredzi"
  ]
};

export function getCitiesByCountryCode(code) {
  return CITIES[code] || [];
}

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