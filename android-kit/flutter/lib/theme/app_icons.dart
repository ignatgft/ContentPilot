import 'package:flutter/widgets.dart';
import 'package:flutter_svg/flutter_svg.dart';

class AppIcons {
  static const alert = 'assets/icons/alert.svg';
  static const arrowLeft = 'assets/icons/arrow-left.svg';
  static const bell = 'assets/icons/bell.svg';
  static const calendar = 'assets/icons/calendar.svg';
  static const chart = 'assets/icons/chart.svg';
  static const check = 'assets/icons/check.svg';
  static const chevronLeft = 'assets/icons/chevron-left.svg';
  static const chevronRight = 'assets/icons/chevron-right.svg';
  static const clock = 'assets/icons/clock.svg';
  static const copy = 'assets/icons/copy.svg';
  static const download = 'assets/icons/download.svg';
  static const edit = 'assets/icons/edit.svg';
  static const eye = 'assets/icons/eye.svg';
  static const eyeOff = 'assets/icons/eye-off.svg';
  static const filter = 'assets/icons/filter.svg';
  static const globe = 'assets/icons/globe.svg';
  static const hash = 'assets/icons/hash.svg';
  static const heart = 'assets/icons/heart.svg';
  static const home = 'assets/icons/home.svg';
  static const image = 'assets/icons/image.svg';
  static const info = 'assets/icons/info.svg';
  static const link = 'assets/icons/link.svg';
  static const lock = 'assets/icons/lock.svg';
  static const logout = 'assets/icons/logout.svg';
  static const mail = 'assets/icons/mail.svg';
  static const menu = 'assets/icons/menu.svg';
  static const message = 'assets/icons/message.svg';
  static const mic = 'assets/icons/mic.svg';
  static const moon = 'assets/icons/moon.svg';
  static const more = 'assets/icons/more.svg';
  static const pause = 'assets/icons/pause.svg';
  static const play = 'assets/icons/play.svg';
  static const plus = 'assets/icons/plus.svg';
  static const refresh = 'assets/icons/refresh.svg';
  static const search = 'assets/icons/search.svg';
  static const send = 'assets/icons/send.svg';
  static const settings = 'assets/icons/settings.svg';
  static const share = 'assets/icons/share.svg';
  static const shieldCheck = 'assets/icons/shield-check.svg';
  static const sparkles = 'assets/icons/sparkles.svg';
  static const store = 'assets/icons/store.svg';
  static const sun = 'assets/icons/sun.svg';
  static const target = 'assets/icons/target.svg';
  static const trash = 'assets/icons/trash.svg';
  static const user = 'assets/icons/user.svg';
  static const users = 'assets/icons/users.svg';
  static const video = 'assets/icons/video.svg';
  static const x = 'assets/icons/x.svg';
}

/// Иконка из дизайн-кита. Цвет задаётся как у текста (currentColor).
class AppIcon extends StatelessWidget {
  const AppIcon(this.path, {super.key, this.size = 24, this.color});
  final String path;
  final double size;
  final Color? color;

  @override
  Widget build(BuildContext context) {
    final c = color ?? DefaultTextStyle.of(context).style.color ?? const Color(0xFF14172B);
    return SvgPicture.asset(path, width: size, height: size, colorFilter: ColorFilter.mode(c, BlendMode.srcIn));
  }
}
