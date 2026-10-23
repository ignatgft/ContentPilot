import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../providers/channel_provider.dart';
import '../../theme/app_theme.dart';

class ChannelsScreen extends ConsumerWidget {
  const ChannelsScreen({super.key});

  void _showConnectDialog(BuildContext context, WidgetRef ref, String platform, String defaultId) {
    final idController = TextEditingController(text: defaultId);
    final tokenController = TextEditingController();

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text('Подключить $platform'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            TextField(
              controller: idController,
              decoration: InputDecoration(
                labelText: platform == 'TELEGRAM'
                    ? '@channel_name или Chat ID'
                    : 'ID группы / канала / аккаунта',
              ),
            ),
            const SizedBox(height: 12),
            if (platform == 'TELEGRAM') ...[
              TextField(
                controller: tokenController,
                decoration: const InputDecoration(
                  labelText: 'Bot Token (опционально для демо)',
                  hintText: '123456:ABC-DEF...',
                ),
              ),
            ],
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Отмена'),
          ),
          FilledButton(
            onPressed: () async {
              Navigator.pop(ctx);
              await ref.read(channelProvider.notifier).connectChannel(
                    platform: platform,
                    externalId: idController.text,
                    botToken: tokenController.text.isNotEmpty ? tokenController.text : null,
                  );
            },
            child: const Text('Подключить'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(channelProvider);
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final colors = isDark ? CpColors.dark : CpColors.light;

    final platforms = [
      {
        'id': 'TELEGRAM',
        'name': 'Telegram Канал',
        'defaultId': '@contentpilot_test',
        'isLive': true,
        'badge': 'В эфире',
        'desc': 'Публикация через официальный Telegram Bot API в публичные и закрытые каналы.',
      },
      {
        'id': 'VK',
        'name': 'ВКонтакте Сообщество',
        'defaultId': 'public_coffee_club',
        'isLive': true,
        'badge': 'В эфире',
        'desc': 'Публикация записей и историй на стену группы через VK Open API.',
      },
      {
        'id': 'YOUTUBE',
        'name': 'YouTube Shorts',
        'defaultId': 'UC_CoffeeChannel_Shorts',
        'isLive': true,
        'badge': 'В эфире',
        'desc': 'Загрузка коротких вертикальных видео (Shorts) через YouTube Data API v3.',
      },
      {
        'id': 'INSTAGRAM',
        'name': 'Instagram Business',
        'defaultId': 'coffee_stories_insta',
        'isLive': true,
        'badge': 'В эфире (Meta Graph API)',
        'desc': 'Публикация фото и Reels через Meta Graph API. Требует привязанную Facebook-страницу.',
      },
      {
        'id': 'TIKTOK',
        'name': 'TikTok Content Posting',
        'defaultId': '@coffee_stories_tiktok',
        'isLive': false,
        'badge': 'Ручной режим (Ожидает аудит)',
        'desc': 'Приложение ожидает завершения аудита TikTok. Доступна подготовка материалов в режиме «Готово к публикации».',
      },
    ];

    return RefreshIndicator(
      onRefresh: () async {
        await ref.read(channelProvider.notifier).fetchChannels();
        await ref.read(channelProvider.notifier).fetchCapabilities();
      },
      child: ListView(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
        children: [
          // Header info
          Card(
            color: colors.chipBg,
            child: Padding(
              padding: const EdgeInsets.all(14),
              child: Row(
                children: [
                  Icon(Icons.hub_outlined, color: colors.accent, size: 28),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      'Подключите каналы для омниканальной публикации контента в один клик.',
                      style: TextStyle(
                        fontSize: 13,
                        color: colors.chipText,
                        fontWeight: FontWeight.w600,
                        height: 1.35,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),

          // Channels Cards
          ...platforms.map((p) {
            final pId = p['id'] as String;
            final isLive = p['isLive'] as bool;

            final connectedChannel = state.channels.where((c) => c.platform.toUpperCase() == pId).isNotEmpty
                ? state.channels.firstWhere((c) => c.platform.toUpperCase() == pId)
                : null;
            final isConnected = connectedChannel != null;

            final cap = state.capabilities.where((c) => c.platform.toUpperCase() == pId).isNotEmpty
                ? state.capabilities.firstWhere((c) => c.platform.toUpperCase() == pId)
                : null;

            return Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Expanded(
                            child: Row(
                              children: [
                                _getPlatformIcon(pId, colors),
                                const SizedBox(width: 10),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        p['name'] as String,
                                        style: TextStyle(
                                          fontSize: 15,
                                          fontWeight: FontWeight.w800,
                                          color: colors.ink,
                                        ),
                                      ),
                                      const SizedBox(height: 2),
                                      Text(
                                        isConnected ? connectedChannel.externalId : 'Не подключен',
                                        style: TextStyle(
                                          fontSize: 12,
                                          color: isConnected ? colors.success : colors.muted,
                                          fontWeight: isConnected ? FontWeight.w700 : FontWeight.w500,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                            decoration: BoxDecoration(
                              color: isLive ? colors.success.withOpacity(0.12) : Colors.amber.withOpacity(0.15),
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: Text(
                              isLive ? 'В эфире' : 'Ручной',
                              style: TextStyle(
                                fontSize: 10,
                                fontWeight: FontWeight.w700,
                                color: isLive ? colors.success : Colors.amber.shade800,
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 10),
                      Text(
                        p['desc'] as String,
                        style: TextStyle(fontSize: 12, color: colors.muted, height: 1.35),
                      ),
                      if (cap != null) ...[
                        const SizedBox(height: 10),
                        Wrap(
                          spacing: 6,
                          children: [
                            _buildInfoChip('До ${cap.maxTextLength} симв.', colors),
                            ...cap.supportedMediaTypes.map((m) => _buildInfoChip(m, colors)),
                          ],
                        ),
                      ],
                      if (!isLive && cap?.auditNotice != null) ...[
                        const SizedBox(height: 10),
                        Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color: Colors.amber.withOpacity(0.1),
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Row(
                            children: [
                              const Icon(Icons.info_outline, size: 16, color: Colors.amber),
                              const SizedBox(width: 6),
                              Expanded(
                                child: Text(
                                  cap!.auditNotice!,
                                  style: TextStyle(fontSize: 11, color: colors.ink),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                      const SizedBox(height: 12),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.end,
                        children: [
                          OutlinedButton(
                            style: OutlinedButton.styleFrom(
                              minimumSize: const Size(110, 36),
                              padding: const EdgeInsets.symmetric(horizontal: 12),
                            ),
                            onPressed: () {
                              _showConnectDialog(context, ref, pId, p['defaultId'] as String);
                            },
                            child: Text(isConnected ? 'Изменить' : 'Подключить'),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            );
          }),
        ],
      ),
    );
  }

  Widget _getPlatformIcon(String platform, CpColors colors) {
    IconData icon;
    Color color;

    switch (platform) {
      case 'TELEGRAM':
        icon = Icons.send_rounded;
        color = const Color(0xFF2AABEE);
        break;
      case 'VK':
        icon = Icons.group_work_rounded;
        color = const Color(0xFF0077FF);
        break;
      case 'YOUTUBE':
        icon = Icons.play_circle_fill_rounded;
        color = const Color(0xFFFF0000);
        break;
      case 'INSTAGRAM':
        icon = Icons.camera_alt_rounded;
        color = const Color(0xFFE1306C);
        break;
      case 'TIKTOK':
        icon = Icons.music_note_rounded;
        color = Colors.black;
        break;
      default:
        icon = Icons.public;
        color = colors.accent;
    }

    return Container(
      width: 36,
      height: 36,
      decoration: BoxDecoration(
        color: color.withOpacity(0.12),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Icon(icon, color: color, size: 20),
    );
  }

  Widget _buildInfoChip(String label, CpColors colors) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      decoration: BoxDecoration(
        color: colors.chipBg,
        borderRadius: BorderRadius.circular(4),
      ),
      child: Text(
        label,
        style: TextStyle(fontSize: 10, color: colors.chipText, fontWeight: FontWeight.w600),
      ),
    );
  }
}
