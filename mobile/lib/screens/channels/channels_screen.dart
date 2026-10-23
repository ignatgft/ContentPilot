import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../providers/channel_provider.dart';
import '../../theme/app_theme.dart';
import '../../theme/app_icons.dart';

class ChannelsScreen extends ConsumerWidget {
  const ChannelsScreen({super.key});

  void _showConnectDialog(BuildContext context, WidgetRef ref, String platform, String defaultId) {
    final idController = TextEditingController(text: defaultId);
    final tokenController = TextEditingController();

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(22)),
        title: Row(
          children: [
            PlatformIcon(platform, size: 28),
            const SizedBox(width: 10),
            Text('Подключить $platform', style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 17)),
          ],
        ),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                platform == 'TELEGRAM'
                    ? 'Укажите юзернейм публичного канала (начиная с @) или Chat ID закрытого канала:'
                    : 'Укажите идентификатор страницы или сообщества:',
                style: const TextStyle(fontSize: 12, color: Colors.grey),
              ),
              const SizedBox(height: 10),
              TextField(
                controller: idController,
                decoration: InputDecoration(
                  labelText: platform == 'TELEGRAM'
                      ? '@channel_name или Chat ID'
                      : 'ID группы / канала',
                ),
              ),
              const SizedBox(height: 14),
              if (platform == 'TELEGRAM') ...[
                TextField(
                  controller: tokenController,
                  decoration: const InputDecoration(
                    labelText: 'Bot Token (опционально для демо)',
                    hintText: '123456:ABC-DEF...',
                  ),
                ),
                const SizedBox(height: 8),
                const Text(
                  '💡 Добавьте бота в администраторы канала с правом публикации сообщений.',
                  style: TextStyle(fontSize: 11, color: Colors.grey),
                ),
              ],
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Отмена'),
          ),
          FilledButton(
            style: FilledButton.styleFrom(
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
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
        'badge': 'Ручной режим',
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
          // Header info banner (Pro Max)
          CpCard(
            borderRadius: 18,
            color: colors.chipBg,
            border: Border.all(color: colors.accent.withOpacity(0.2)),
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: colors.accent.withOpacity(0.15),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: AppIcon(AppIcons.share, size: 24, color: colors.accent),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Text(
                    'Подключите соцсети для омниканальной публикации контента в один клик.',
                    style: TextStyle(
                      fontSize: 13,
                      color: colors.chipText,
                      fontWeight: FontWeight.w700,
                      height: 1.35,
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 18),

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
              padding: const EdgeInsets.only(bottom: 14),
              child: CpCard(
                borderRadius: 20,
                padding: const EdgeInsets.all(18),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Expanded(
                          child: Row(
                            children: [
                              PlatformIcon(pId, size: 36),
                              const SizedBox(width: 12),
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
                                    const SizedBox(height: 3),
                                    Row(
                                      children: [
                                        Container(
                                          width: 7,
                                          height: 7,
                                          decoration: BoxDecoration(
                                            shape: BoxShape.circle,
                                            color: isConnected ? colors.success : colors.muted.withOpacity(0.4),
                                            boxShadow: isConnected
                                                ? [
                                                    BoxShadow(
                                                      color: colors.success.withOpacity(0.5),
                                                      blurRadius: 4,
                                                      spreadRadius: 1,
                                                    ),
                                                  ]
                                                : null,
                                          ),
                                        ),
                                        const SizedBox(width: 6),
                                        Expanded(
                                          child: Text(
                                            isConnected ? connectedChannel.externalId : 'Не подключен',
                                            style: TextStyle(
                                              fontSize: 12,
                                              color: isConnected ? colors.success : colors.muted,
                                              fontWeight: isConnected ? FontWeight.w700 : FontWeight.w500,
                                            ),
                                            maxLines: 1,
                                            overflow: TextOverflow.ellipsis,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(
                            color: isLive ? colors.success.withOpacity(0.12) : Colors.amber.withOpacity(0.15),
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(
                              color: (isLive ? colors.success : Colors.amber).withOpacity(0.3),
                            ),
                          ),
                          child: Text(
                            isLive ? 'В эфире' : 'Ручной',
                            style: TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.w800,
                              color: isLive ? colors.success : Colors.amber.shade800,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Text(
                      p['desc'] as String,
                      style: TextStyle(fontSize: 12, color: colors.muted, height: 1.4),
                    ),
                    if (cap != null) ...[
                      const SizedBox(height: 12),
                      Wrap(
                        spacing: 6,
                        runSpacing: 6,
                        children: [
                          _buildInfoChip('До ${cap.maxTextLength} симв.', colors),
                          ...cap.supportedMediaTypes.map((m) => _buildInfoChip(m, colors)),
                        ],
                      ),
                    ],
                    if (!isLive && cap?.auditNotice != null) ...[
                      const SizedBox(height: 12),
                      Container(
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: Colors.amber.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(color: Colors.amber.withOpacity(0.3)),
                        ),
                        child: Row(
                          children: [
                            const Icon(Icons.info_outline, size: 16, color: Colors.amber),
                            const SizedBox(width: 8),
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
                    const SizedBox(height: 14),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.end,
                      children: [
                        FilledButton.tonal(
                          style: FilledButton.styleFrom(
                            minimumSize: const Size(120, 38),
                            padding: const EdgeInsets.symmetric(horizontal: 14),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                          ),
                          onPressed: () {
                            _showConnectDialog(context, ref, pId, p['defaultId'] as String);
                          },
                          child: Text(
                            isConnected ? 'Настроить' : 'Подключить',
                            style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            );
          }),
        ],
      ),
    );
  }

  Widget _buildInfoChip(String label, CpColors colors) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: colors.chipBg,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(
        label,
        style: TextStyle(fontSize: 10, color: colors.chipText, fontWeight: FontWeight.w700),
      ),
    );
  }
}
