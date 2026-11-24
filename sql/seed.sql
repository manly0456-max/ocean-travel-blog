-- =====================================================================
--  WANDERWAVE – DỮ LIỆU MẪU
--  TRUNCATE xoá sạch dữ liệu cũ & đặt lại bộ đếm id -> chạy lại bao nhiêu lần cũng được.
-- =====================================================================
TRUNCATE comments, posts, subscribers, contacts RESTART IDENTITY CASCADE;

INSERT INTO posts
  (slug, title, excerpt, content, category, location, country, cover_image,
   read_minutes, distance_km, likes, views, travel_date, is_featured)
VALUES
(
  'ha-long-vinh-ngoc', 'Hạ Long – Vịnh ngọc giữa mây trời',
  'Ba ngày hai đêm trên du thuyền, chèo kayak qua hang Luồn và ngắm bình minh trên đỉnh Ti Tốp.',
  'Chuyến đi bắt đầu từ sáng sớm ở cảng Tuần Châu. Khi du thuyền rời bến, những khối đá vôi khổng lồ dần hiện ra trong làn sương mỏng như một bức tranh thuỷ mặc.

Buổi chiều mình chèo kayak qua hang Luồn. Nước trong đến mức nhìn thấy cả đàn cá nhỏ bơi dưới mái chèo. Bên trong là một hồ nước kín, yên tĩnh tới mức chỉ nghe tiếng chim và tiếng sóng vỗ nhẹ.

Sáng hôm sau, leo 400 bậc lên đỉnh Ti Tốp để ngắm bình minh. Toàn cảnh vịnh trải dài dưới chân, ánh nắng đầu tiên nhuộm vàng mặt biển. Đó là khoảnh khắc mình biết vì sao Hạ Long được gọi là kỳ quan.',
  'beach', 'Quảng Ninh', 'Việt Nam', '/assets/img/halong.jpg', 6, 165, 128, 940, '2025-03-14', TRUE
),
(
  'sa-pa-san-may', 'Sa Pa – Săn mây trên nóc nhà Đông Dương',
  'Chinh phục Fansipan 3.143m, lạc giữa biển mây và ruộng bậc thang mùa lúa chín.',
  'Mình đến Sa Pa vào tháng Chín, đúng mùa lúa chín. Những thửa ruộng bậc thang ở Lao Chải, Tả Van óng ả như dát vàng, uốn lượn theo sườn núi.

Ngày thứ hai, mình chọn đi cáp treo lên Fansipan rồi leo thêm 600 bậc đá. Khi lên tới đỉnh, biển mây cuồn cuộn ngay dưới chân, gió lạnh buốt nhưng cảm giác thì thật sự choáng ngợp.

Buổi tối ở thị trấn, một bát thắng cố nóng hổi và vài xiên thịt nướng bên bếp than là cách tuyệt vời nhất để kết thúc ngày dài.',
  'mountain', 'Lào Cai', 'Việt Nam', '/assets/img/sapa.jpg', 7, 320, 214, 1530, '2025-09-20', TRUE
),
(
  'hoi-an-den-long', 'Hội An – Phố cổ lung linh đèn lồng',
  'Dạo bước phố cổ về đêm, thả hoa đăng trên sông Hoài và thưởng thức cao lầu đúng vị.',
  'Hội An đẹp nhất khi hoàng hôn buông xuống. Hàng nghìn chiếc đèn lồng được thắp sáng, phản chiếu lung linh trên mặt sông Hoài.

Mình thuê một chiếc xe đạp, đi qua những con hẻm nhỏ với tường vàng phủ hoa giấy. Mỗi góc phố đều có thể trở thành một khung hình đẹp.

Đừng quên thử cao lầu, mì Quảng và bánh mì Phượng. Và nhất định phải thả một chiếc hoa đăng để gửi điều ước theo dòng nước.',
  'city', 'Quảng Nam', 'Việt Nam', '/assets/img/hoian.jpg', 5, 880, 186, 1210, '2025-06-02', TRUE
),
(
  'phu-quoc-hoang-hon', 'Phú Quốc – Hoàng hôn ở đảo ngọc',
  'Lặn ngắm san hô Hòn Thơm, ngắm hoàng hôn Sunset Town và chợ đêm hải sản Dinh Cậu.',
  'Phú Quốc chào đón mình bằng làn nước xanh ngọc và bãi cát trắng mịn ở Bãi Sao.

Tour lặn ngắm san hô ở quần đảo An Thới thật đáng tiền: rạn san hô nhiều màu sắc, cá hề, cá thia bơi ngay trước mặt.

Buổi tối, ngồi ở Sunset Town ngắm mặt trời lặn dần xuống biển, sau đó ghé chợ đêm Dinh Cậu ăn ghẹ hấp và gỏi cá trích.',
  'beach', 'Kiên Giang', 'Việt Nam', '/assets/img/phuquoc.jpg', 5, 1150, 97, 760, '2025-01-10', FALSE
),
(
  'ha-giang-ma-pi-leng', 'Hà Giang – Vòng cung Mã Pí Lèng',
  'Bốn ngày xe máy qua cung đường đèo hùng vĩ bậc nhất Việt Nam và dòng Nho Quế xanh biếc.',
  'Cung đường Hà Giang – Đồng Văn – Mèo Vạc là giấc mơ của bất kỳ ai mê phượt.

Đứng trên đèo Mã Pí Lèng nhìn xuống, dòng Nho Quế như một sợi chỉ xanh ngọc vắt qua hẻm vực sâu hun hút.

Mình đi thuyền trên sông Nho Quế, len giữa hai vách đá cao hàng trăm mét. Đó là trải nghiệm khiến mình muốn quay lại ngay lần sau.',
  'mountain', 'Hà Giang', 'Việt Nam', '/assets/img/hagiang.jpg', 8, 420, 173, 1100, '2024-11-05', FALSE
),
(
  'kyoto-mua-la-do', 'Kyoto – Mùa lá đỏ cố đô',
  'Thăm Fushimi Inari, rừng trúc Arashiyama và những ngôi đền rực đỏ mùa thu Nhật Bản.',
  'Kyoto vào cuối tháng Mười Một là một bức tranh đỏ và vàng. Lá phong phủ kín các khu vườn đền chùa.

Mình dậy từ 6 giờ sáng để đi Fushimi Inari khi còn vắng khách. Hàng nghìn cổng torii đỏ nối tiếp nhau lên núi, đẹp như một đường hầm thời gian.

Chiều đến, rừng trúc Arashiyama xào xạc trong gió. Kết thúc ngày bằng một bát udon nóng và trà matcha ở Gion.',
  'city', 'Kyoto', 'Nhật Bản', '/assets/img/kyoto.jpg', 6, 3700, 241, 1820, '2024-11-25', FALSE
),
(
  'bali-ruong-bac-thang', 'Bali – Đền nước và ruộng bậc thang',
  'Ubud yên bình, ruộng Tegallalang xanh mướt và đền Tanah Lot trên biển lúc hoàng hôn.',
  'Bali không chỉ có biển. Ubud là trung tâm văn hoá với những ngôi đền cổ và các lớp học yoga giữa rừng.

Ruộng bậc thang Tegallalang xanh mướt, mình thử đu dây "Bali swing" và ngắm toàn cảnh thung lũng.

Hoàng hôn ở đền Tanah Lot là khoảnh khắc khó quên: ngôi đền đứng giữa sóng biển, bầu trời chuyển màu từ cam sang tím.',
  'beach', 'Bali', 'Indonesia', '/assets/img/bali.jpg', 6, 2900, 158, 980, '2024-07-18', FALSE
),
(
  'bangkok-street-food', 'Bangkok – Thiên đường street food về đêm',
  'Từ pad thai, xoài nếp đến tôm nướng Yaowarat: bản đồ ăn đêm cho người mê ẩm thực.',
  'Bangkok về đêm là một lễ hội ẩm thực. Phố Yaowarat (Chinatown) sáng rực đèn neon và khói nướng.

Mình bắt đầu với pad thai ở Thip Samai, sau đó là tôm nướng, súp tom yum và kết thúc bằng xoài nếp ngọt lịm.

Mẹo nhỏ: hãy chọn quán đông người địa phương, mang theo tiền mặt và đừng ngại thử những món lạ.',
  'food', 'Bangkok', 'Thái Lan', '/assets/img/bangkok.jpg', 4, 1600, 132, 870, '2024-04-12', FALSE
),
(
  'hue-am-thuc-cung-dinh', 'Huế – Hương vị ẩm thực cung đình',
  'Bún bò, bánh bèo, chè Huế và một bữa cơm cung đình trong không gian nhà rường cổ.',
  'Huế trầm mặc với Đại Nội và sông Hương, nhưng ẩm thực Huế thì vô cùng phong phú.

Buổi sáng là bát bún bò Huế cay nồng, buổi trưa là bánh bèo, bánh nậm, bánh lọc. Chiều ghé chợ Đông Ba ăn chè.

Tối, mình thử một bữa cơm cung đình với những món được bày biện công phu như tác phẩm nghệ thuật.',
  'food', 'Thừa Thiên Huế', 'Việt Nam', '/assets/img/hue.jpg', 5, 660, 89, 640, '2025-04-28', FALSE
),
(
  'santorini-mai-vom-xanh', 'Santorini – Mái vòm xanh bên biển Aegean',
  'Lang thang Oia với những ngôi nhà trắng, mái vòm xanh và hoàng hôn đẹp nhất thế giới.',
  'Santorini đúng như trong những tấm bưu thiếp: nhà trắng, mái vòm xanh dương và biển Aegean xanh thẳm.

Mình đi bộ từ Fira tới Oia theo đường mòn ven vách núi, khoảng 10km nhưng mỗi bước đều là một khung cảnh tuyệt đẹp.

Hoàng hôn ở Oia đông nghịt người nhưng xứng đáng. Khi mặt trời chạm biển, cả đám đông vỗ tay như một buổi hoà nhạc.',
  'beach', 'Cyclades', 'Hy Lạp', '/assets/img/santorini.jpg', 6, 8600, 265, 2050, '2024-06-08', FALSE
);

INSERT INTO comments (post_id, author_name, content) VALUES
(1, 'Minh Anh',  'Ảnh đẹp quá! Cho mình xin tên du thuyền với ạ.'),
(1, 'Quốc Bảo',  'Hang Luồn chèo kayak đúng là đỉnh, mình đi năm ngoái rồi.'),
(2, 'Thu Trang', 'Tháng 9 đi Sa Pa là chuẩn bài luôn, lúa chín vàng rực.'),
(3, 'Hải Đăng',  'Bánh mì Phượng thì phải xếp hàng lâu không bạn?'),
(5, 'Tuấn Kiệt', 'Mã Pí Lèng là cung đèo đẹp nhất mình từng đi!'),
(6, 'Lan Chi',   'Fushimi Inari đi sớm đúng là vắng và đẹp hơn hẳn.'),
(10,'Gia Huy',   'Đi bộ Fira - Oia có mệt không bạn?');

INSERT INTO subscribers (email) VALUES ('demo.reader@wanderwave.vn');
